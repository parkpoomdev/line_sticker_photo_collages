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

// Create collage (returns both original and 240x240 versions)
app.post("/api/collage", async (req, res) => {
  try {
    const { imagePaths, cols } = req.body;

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

    const timestamp = Date.now();

    // Helper to build a collage for a given mode
    const buildCollage = async (mode) => {
      const isLineProtocol = mode === "line-protocol";
      const tileWidth = isLineProtocol
        ? 240
        : Math.max(500, ...imageMetadata.map((img) => img.width || 0));
      const tileHeight = isLineProtocol
        ? 240
        : Math.max(500, ...imageMetadata.map((img) => img.height || 0));

      let canvasWidth = tileWidth * cols_num;
      let canvasHeight = tileHeight * rows;

      const overlays = [];
      for (let i = 0; i < imageMetadata.length; i++) {
        const col = i % cols_num;
        const row = Math.floor(i / cols_num);
        const left = col * tileWidth;
        const top = row * tileHeight;

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

      let collageBuffer = await sharp({
        create: {
          width: canvasWidth,
          height: canvasHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite(overlays)
        .png({ quality: 100, compressionLevel: 6 })
        .toBuffer();

      // For line-protocol mode, scale the final collage to exactly 240x240
      if (isLineProtocol) {
        collageBuffer = await sharp(collageBuffer)
          .resize(240, 240, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255 },
          })
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        canvasWidth = 240;
        canvasHeight = 240;
      }

      const filename = `collage-${mode}-${timestamp}.png`;
      const outputPath = path.join("output", filename);
      await fs.promises.writeFile(outputPath, collageBuffer);

      const assetsPath = path.join("public", "assets", filename);
      await fs.promises.writeFile(assetsPath, collageBuffer);

      return {
        filename,
        dimensions: {
          width: canvasWidth,
          height: canvasHeight,
          cols: cols_num,
          rows,
          tileWidth,
          tileHeight,
        },
      };
    };

    const original = await buildCollage("original");
    const lineProtocol = await buildCollage("line-protocol");

    // Clean up uploaded files
    await Promise.all(
      imagePaths.map((imagePath) =>
        fs.promises
          .unlink(imagePath)
          .catch((err) => console.error(`Error deleting ${imagePath}:`, err))
      )
    );

    res.json({
      success: true,
      collages: {
        original,
        lineProtocol,
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
    console.error(`File not found: ${filepath}`);
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const stats = fs.statSync(filepath);
    const stream = fs.createReadStream(filepath);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    stream.pipe(res);

    stream.on("error", (err) => {
      console.error(`Stream error for ${filepath}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download error" });
      }
    });
  } catch (error) {
    console.error(`Download error for ${filepath}:`, error);
    res.status(500).json({ error: error.message });
  }
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
