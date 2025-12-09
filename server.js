const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const app = express();

const PORT = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Ensure directories exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("output")) fs.mkdirSync("output");
if (!fs.existsSync("public/assets"))
  fs.mkdirSync("public/assets", { recursive: true });

// Routes

// Upload images
app.post("/api/upload", upload.array("images", 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const filePaths = req.files.map((file) => file.path);
  res.json({ success: true, files: filePaths });
});

// Create collage
app.post("/api/collage", async (req, res) => {
  try {
    const { imagePaths, cols, exportMode } = req.body;

    if (!imagePaths || imagePaths.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const cols_num = parseInt(cols) || 1;
    const rows = Math.ceil(imagePaths.length / cols_num);

    // Load and get metadata for each image
    const imageMetadata = [];
    for (const imagePath of imagePaths) {
      try {
        const metadata = await sharp(imagePath).metadata();
        imageMetadata.push({ path: imagePath, ...metadata });
      } catch (err) {
        console.error(`Error reading image ${imagePath}:`, err);
      }
    }

    if (imageMetadata.length === 0) {
      return res.status(400).json({ error: "No valid images to process" });
    }

    // Determine tile size based on export mode
    let tileWidth, tileHeight;

    if (exportMode === "line-protocol") {
      // Line protocol: 240 x 240
      tileWidth = 240;
      tileHeight = 240;
    } else {
      // Original size: use largest dimensions or average
      tileWidth = Math.max(...imageMetadata.map((img) => img.width));
      tileHeight = Math.max(...imageMetadata.map((img) => img.height));
    }

    // Create composite image
    const canvasWidth = tileWidth * cols_num;
    const canvasHeight = tileHeight * rows;

    // Create a blank canvas
    let composite = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    });

    // Prepare image overlays
    const overlays = [];
    for (let i = 0; i < imageMetadata.length; i++) {
      const col = i % cols_num;
      const row = Math.floor(i / cols_num);
      const left = col * tileWidth;
      const top = row * tileHeight;

      // Resize image to tile size
      const resizedImageBuffer = await sharp(imageMetadata[i].path)
        .resize(tileWidth, tileHeight, {
          fit: "cover",
          position: "center",
        })
        .toBuffer();

      overlays.push({
        input: resizedImageBuffer,
        left,
        top,
      });
    }

    // Apply all overlays to composite and ensure PNG format
    const collageBuffer = await composite
      .composite(overlays)
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    // Save collage to output folder
    const timestamp = Date.now();
    const filename = `collage-${timestamp}.png`;
    const outputPath = path.join("output", filename);
    await fs.promises.writeFile(outputPath, collageBuffer);

    // Also save to public/assets for preview
    const assetsPath = path.join("public", "assets", filename);
    await fs.promises.writeFile(assetsPath, collageBuffer);

    // Clean up uploaded files
    for (const imagePath of imagePaths) {
      try {
        await fs.promises.unlink(imagePath);
      } catch (err) {
        console.error(`Error deleting ${imagePath}:`, err);
      }
    }

    res.json({
      success: true,
      collage: filename,
      dimensions: {
        width: canvasWidth,
        height: canvasHeight,
        cols: cols_num,
        rows: rows,
        tileWidth,
        tileHeight,
      },
    });
  } catch (error) {
    console.error("Error creating collage:", error);
    res.status(500).json({ error: error.message });
  }
});

// Download collage
app.get("/api/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join("output", filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.sendFile(path.resolve(filepath));
});

// Preview collage
app.get("/api/preview/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join("output", filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(path.resolve(filepath));
});

// Start server
app.listen(PORT, () => {
  console.log(`Image Collage Server running at http://localhost:${PORT}`);
});
