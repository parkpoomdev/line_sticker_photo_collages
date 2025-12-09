# 🎨 Image Collage Maker

A Node.js web application that combines multiple images into customizable grid layouts with flexible export options.

<img width="2522" height="4474" alt="image" src="https://github.com/user-attachments/assets/df9fc2e0-1d6d-4858-8582-a4ab89839af5" />


## Features

- 📤 **Upload Multiple Images** - Select and preview multiple images at once
- 🎨 **Flexible Grid Layouts** - Choose from 1x N, 2x N, 3x N, or 4x N grid configurations
- 📦 **Export Options**:
  - **Original Size** - Combines all images at their maximum dimensions
  - **Line Protocol (240 x 240)** - Exports collage with standardized 240x240 tile size
- 🖼️ **Live Preview** - View the collage before downloading
- ⬇️ **Easy Download** - Download the final collage as PNG

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Navigate to the project directory:
```bash
cd image_collage
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

### Using the Application

1. Open your browser to `http://localhost:3000`
2. Click "Select Multiple Images" and choose the images you want to combine
3. Select your desired grid layout (1, 2, 3, or 4 columns)
4. Choose your export size (Original or 240 x 240)
5. Click "Create Collage" to generate the grid
6. Preview the result and click "Download Collage" to save it

## Project Structure

```
image_collage/
├── public/
│   └── index.html          # Frontend UI
├── uploads/                # Temporary storage for uploaded images
├── output/                 # Generated collage images
├── server.js              # Express server and image processing logic
├── package.json           # Project dependencies
└── README.md              # This file
```

## Technologies Used

- **Express.js** - Web framework
- **Multer** - File upload handling
- **Sharp** - Image processing and manipulation
- **HTML/CSS/JavaScript** - Frontend UI

## How It Works

1. **Image Upload** - Images are uploaded via multipart form data and stored temporarily
2. **Layout Processing** - The application arranges images in the selected grid layout
3. **Image Resizing** - Each image is resized to fit the tile size (either original max dimensions or 240x240)
4. **Composite Creation** - All tiles are composited onto a single canvas
5. **Export** - The final collage is saved as a PNG and available for download

## Export Modes

### Original Size
- Images are resized to the maximum dimensions found among all images
- Creates a collage that preserves original image proportions as much as possible

### Line Protocol (240 x 240)
- Each image tile is standardized to 240 x 240 pixels
- Perfect for consistent, uniform grid layouts
- Ideal for social media and web sharing

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

MIT
