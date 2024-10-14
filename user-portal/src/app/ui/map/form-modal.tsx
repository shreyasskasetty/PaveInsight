import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

type FormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
};

const FormModal: React.FC<FormModalProps> = ({ open, onClose, onSubmit }) => {
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const clearForm = () => {
    setFormValues({
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
    });
    setErrors({
      name: '',
      email: '',
      phone: '',
    });
  };

  const validate = () => {
    let tempErrors = { name: '', email: '', phone: '' };
    if (!formValues.name) tempErrors.name = 'Name is required';
    if (!formValues.email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      tempErrors.email = 'Email is not valid';
    }
    if (!formValues.phone) tempErrors.phone = 'Phone number is required';
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === '');
  };

  const handleSubmit = () => {
    if (validate()) {
      const data = {
        ...formValues,
      };
      onSubmit(data);
      clearForm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: '#333', // Dark theme background
          color: '#fff', // Dark theme text color
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, color: '#fff' }}> {/* Dark theme for title */}
        Submit Your Information
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#fff', // Dark theme icon color
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: '#444', color: '#fff' }}>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            required
            label="Name"
            name="name"
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.name}
            helperText={errors.name}
            value={formValues.name}
            onChange={handleInputChange}
            InputLabelProps={{ style: { color: '#fff' } }} // Dark theme label
            InputProps={{
              style: { color: '#fff', backgroundColor: '#555' }, // Dark theme input field
            }}
          />
          <TextField
            required
            label="Email"
            name="email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.email}
            helperText={errors.email}
            value={formValues.email}
            onChange={handleInputChange}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{
              style: { color: '#fff', backgroundColor: '#555' },
            }}
          />
          <TextField
            required
            label="Phone Number"
            name="phone"
            type="tel"
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.phone}
            helperText={errors.phone}
            value={formValues.phone}
            onChange={handleInputChange}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{
              style: { color: '#fff', backgroundColor: '#555' },
            }}
          />
          <TextField
            label="Company Name"
            name="company"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formValues.company}
            onChange={handleInputChange}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{
              style: { color: '#fff', backgroundColor: '#555' },
            }}
          />
          {/* Message Section */}
          <TextField
            label="Message"
            name="message"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            value={formValues.message}
            onChange={handleInputChange}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{
              style: { color: '#fff', backgroundColor: '#555' },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" sx={{ backgroundColor: '#1976d2' }}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { FormModal };
