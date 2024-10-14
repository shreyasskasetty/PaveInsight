import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { IconButton, Menu, MenuItem, ListItemIcon, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Typography, Divider, } from '@mui/material';
import DrawIcon from '@mui/icons-material/Create';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RectangleIcon from '@mui/icons-material/CropSquare';
import StraightLineIcon from '@mui/icons-material/HorizontalRule';
import CircleIcon from '@mui/icons-material/PanoramaFishEye';
import SelectIcon from '@mui/icons-material/TouchApp';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { userFormStore } from '@/store/form-store';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type HeaderProps = {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  onToggleDrawing: (tool: boolean) => void;
  setDrawingTool: (tool: google.maps.drawing.OverlayType | null) => void;
};

const Header: React.FC<HeaderProps> = ({ onPlaceSelected, onToggleDrawing, setDrawingTool}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const openFormModal = userFormStore((state: any) => state.setOpen)
  const onLoadAutocomplete = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };
  const router = useRouter();
  const { data: session } = useSession();
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (tool: google.maps.drawing.OverlayType | null) => {
    setDrawingTool(tool);
    if(tool == null){
      onToggleDrawing(false);
    } else{
      onToggleDrawing(true);
    }
    setAnchorEl(null);
  };

  const handleUploadClick = () => {
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    setSelectedFile(null); // Clear selected file on close
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  console.log(session)
  const handleSubmit = () => {
    if (selectedFile) {
      // Handle file submission (KML or GeoJSON)
      console.log('Submitting file:', selectedFile.name);
      // Perform file processing to check if the file is in correct format
    }
    handleModalClose();
    openFormModal(true);
  };
  return (
    <header style={styles.header}>
      <div style={styles.searchContainer}>
        {/* Draw Icon Button */}
       

        {/* Autocomplete Search Bar */}
        <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
          <input type="text" placeholder="Search places" style={styles.searchInput} />
        </Autocomplete>
        <Tooltip title="Draw Polygon">
        <IconButton onClick={handleMenuClick} style={styles.iconButton}>
          <DrawIcon />
          <ArrowDropDownIcon />
        </IconButton>
        </Tooltip>
        {/* Dropdown Menu for drawing options */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => handleMenuClose(google.maps.drawing.OverlayType.RECTANGLE)}>
            <ListItemIcon>
              <RectangleIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose(google.maps.drawing.OverlayType.POLYGON)}>
            <ListItemIcon>
              <StraightLineIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose(google.maps.drawing.OverlayType.CIRCLE)}>
            <ListItemIcon>
              <CircleIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose(null)}>
            <ListItemIcon>
              <SelectIcon fontSize="small" />
            </ListItemIcon>
          </MenuItem>
        </Menu>
        <Tooltip title="Upload KML/GeoJSON">
        <IconButton onClick={handleUploadClick} style={styles.iconButton}>
          <CloudUploadIcon />
        </IconButton>
        </Tooltip>
         {/* Admin Login Button */}
      </div>
      {/* Conditional rendering for Admin/Login/Logout */}
      {session ? (
        <>
            <Button
              variant="contained"
              style={styles.adminButton}
              onClick={() => router.push('/admin/dashboard')}
            >
            Dashboard
            </Button>
          <Button
            variant="contained"
            style={styles.adminButton}
            onClick={() => signOut()} // Using signOut for logout
          >
            Logout
          </Button>
        </>
        ) : (
          <Button
            variant="contained"
            style={styles.adminButton}
            onClick={() => signIn(undefined, {
              callbackUrl: '/admin/dashboard', 
            })} // Using signIn for admin login
          >
            Admin Login
          </Button>
        )}
      {/* Modal for Uploading KML/GeoJSON */}
      <Dialog
        open={modalIsOpen}
        onClose={handleModalClose}
        PaperProps={{
          sx: {
            backgroundColor: '#2A2A2D', // Dark theme background
            color: '#fff', // Dark theme text color
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Upload Polygon
          <Divider sx={{ backgroundColor: '#555', marginTop: 1 }} /> {/* Line below title */}
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: '#bbb', marginBottom: 2 }}>
            You can upload KML or GeoJSON files that contain polygon information.
            Files should be compatible with common geographic standards.
            Ensure that files are well-formatted for proper rendering.
          </Typography>

          <Box
            sx={{
              width: '100%',
              border: '2px dashed #555',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#333',
            }}
          >
            <input
              type="file"
              accept=".kml,.geojson"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="upload-file"
            />
            <label htmlFor="upload-file" style={{ cursor: 'pointer', color: '#fff' }}>
              <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc' }} /> {/* Cloud Upload Icon */}
              {selectedFile ? (
                <Typography>{selectedFile.name}</Typography>
              ) : (
                <Typography>To upload, Drag & Drop or Click here</Typography>
              )}
            </label>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleModalClose} color="secondary" sx={{ color: '#fff' }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" disabled={!selectedFile} sx={{ color: '#fff' }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#2A2A2D',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    position: 'fixed' as 'fixed', // Type assertion for TypeScript
    width: '100%',
    top: 0,
  },
  searchContainer: {
    display: 'flex', // Ensure that items are horizontally aligned
    alignItems: 'center', // Vertically align items
    justifyContent: 'flex-start',
    width: '100%',
  },
  searchInput: {
    width: '100%',
    height: '32px',
    padding: '0 10px',
    borderRadius: '3px',
    fontSize: '14px',
    marginLeft: '8px', // Small gap between button and input
  },
  iconButton: {
    padding: '8px',
    marginLeft: '15px',
    height: '32px',
    backgroundColor: '#fff',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  adminButton: {
    backgroundColor: 'goldenrod',
    color: '#fff',
    width: '150px',
    marginLeft: '15px',
    fontWeight: 'bold',
    textTransform: 'none', // Optional: keeps the text case as is
    boxShadow: 'none',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: '#DAA520',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', // Add shadow effect on hover
    },
  },
};

export default Header;
