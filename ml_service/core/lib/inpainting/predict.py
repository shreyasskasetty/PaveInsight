#!/usr/bin/env python3

import logging
import os
import sys
import traceback

import cv2
import numpy as np
import torch
import tqdm
import yaml
from omegaconf import OmegaConf
from torch.utils.data._utils.collate import default_collate
sys.path.append(os.path.dirname(__file__))

from saicinpainting.evaluation.utils import move_to_device
from saicinpainting.evaluation.refinement import refine_predict
from saicinpainting.training.data.datasets import make_default_val_dataset
from saicinpainting.training.trainers import load_checkpoint
from saicinpainting.utils import register_debug_signal_handlers

LOGGER = logging.getLogger(__name__)

# Set environment variables
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['VECLIB_MAXIMUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'


def predict(predict_config_path: str):
    try:
        # Load the configuration
        with open(predict_config_path, 'r') as cfg_file:
            predict_config = OmegaConf.load(cfg_file)

        if sys.platform != 'win32':
            register_debug_signal_handlers()

        device = torch.device("cpu")

        # Load model training config
        train_config_path = os.path.join(predict_config.model.path, 'config.yaml')
        with open(train_config_path, 'r') as f:
            train_config = OmegaConf.create(yaml.safe_load(f))

        train_config.training_model.predict_only = True
        train_config.visualizer.kind = 'noop'

        out_ext = predict_config.get('out_ext', '.png')

        checkpoint_path = os.path.join(predict_config.model.path,
                                       'models',
                                       predict_config.model.checkpoint)
        model = load_checkpoint(train_config, checkpoint_path, strict=False, map_location='cpu')
        model.freeze()
        if not predict_config.get('refine', False):
            model.to(device)

        if not predict_config.indir.endswith('/'):
            predict_config.indir += '/'

        dataset = make_default_val_dataset(predict_config.indir, **predict_config.dataset)

        for img_i in tqdm.trange(len(dataset)):
            mask_fname = dataset.mask_filenames[img_i]
            cur_out_fname = os.path.join(
                predict_config.outdir,
                os.path.splitext(mask_fname[len(predict_config.indir):])[0] + out_ext
            )
            os.makedirs(os.path.dirname(cur_out_fname), exist_ok=True)
            batch = default_collate([dataset[img_i]])
            if predict_config.get('refine', False):
                assert 'unpad_to_size' in batch, "Unpadded size is required for the refinement"
                cur_res = refine_predict(batch, model, **predict_config.refiner)
                cur_res = cur_res[0].permute(1, 2, 0).detach().cpu().numpy()
            else:
                with torch.no_grad():
                    batch = move_to_device(batch, device)
                    batch['mask'] = (batch['mask'] > 0) * 1
                    batch = model(batch)
                    cur_res = batch[predict_config.out_key][0].permute(1, 2, 0).detach().cpu().numpy()
                    unpad_to_size = batch.get('unpad_to_size', None)
                    if unpad_to_size is not None:
                        orig_height, orig_width = unpad_to_size
                        cur_res = cur_res[:orig_height, :orig_width]

            cur_res = np.clip(cur_res * 255, 0, 255).astype('uint8')
            cur_res = cv2.cvtColor(cur_res, cv2.COLOR_RGB2BGR)
            cv2.imwrite(cur_out_fname, cur_res)

    except KeyboardInterrupt:
        LOGGER.warning('Interrupted by user')
    except Exception as ex:
        LOGGER.critical(f'Prediction failed due to {ex}:\n{traceback.format_exc()}')
        sys.exit(1)


# Example of how to call the function programmatically
if __name__ == '__main__':
    predict_config_path = os.path.join(os.path.dirname(__file__), "configs/prediction/predict_config.yaml")
    predict(predict_config_path)
