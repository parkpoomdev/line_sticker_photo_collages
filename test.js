const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const assert = require("assert");

// Test paths
const testAssetsDir =
  "/Users/user/Desktop/devspace/image_collage/assets/Preppy IIII";
const testOutputDir = "/tmp/collage-test";

// Ensure test output directory exists
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir, { recursive: true });
}

// Test suite
async function runTests() {
  console.log("🧪 Starting Image Collage Tests...\n");

  try {
    // Test 1: Verify test files exist
    console.log("Test 1: Verify test image files exist");
    const files = fs
      .readdirSync(testAssetsDir)
      .filter((f) => f.endsWith(".png"));
    assert(files.length > 0, "No PNG files found in test assets");
    console.log(`✅ Found ${files.length} test images\n`);

    // Test 2: Create 240x240 collage with 1 column (should be exactly 240x240 final size)
    console.log("Test 2: Create 240x240 collage (1 column layout)");
    const collage240 = await createCollage(
      files.map((f) => path.join(testAssetsDir, f)),
      1,
      "line-protocol"
    );

    const metadata240 = await sharp(collage240).metadata();
    console.log(
      `Generated collage dimensions: ${metadata240.width} x ${metadata240.height}`
    );
    console.log(`Expected: 240 x 240 (final scaled size)`);

    // Verify 240x240 final size
    assert.strictEqual(
      metadata240.width,
      240,
      `Expected width 240, got ${metadata240.width}`
    );
    assert.strictEqual(
      metadata240.height,
      240,
      `Expected height 240, got ${metadata240.height}`
    );
    console.log("✅ 240x240 collage dimensions verified (exactly 240x240)\n");

    // Test 3: Create original size collage with 1 column
    console.log("Test 3: Create original size collage (1 column layout)");
    const collageOriginal = await createCollage(
      files.map((f) => path.join(testAssetsDir, f)),
      1,
      "original"
    );

    const metadataOriginal = await sharp(collageOriginal).metadata();
    console.log(
      `Generated collage dimensions: ${metadataOriginal.width} x ${metadataOriginal.height}`
    );

    // Original should have max width of all images
    assert(
      metadataOriginal.width >= 240,
      `Original width should be at least 240, got ${metadataOriginal.width}`
    );
    assert(
      metadataOriginal.height >= 240 * files.length,
      `Original height should be at least ${240 * files.length}, got ${
        metadataOriginal.height
      }`
    );
    console.log("✅ Original size collage dimensions verified\n");

    // Test 4: Compare 240x240 vs Original
    console.log("Test 4: Compare 240x240 vs Original collage");
    const size240 = fs.statSync(collage240).size;
    const sizeOriginal = fs.statSync(collageOriginal).size;
    console.log(`240x240 collage size: ${(size240 / 1024).toFixed(2)} KB`);
    console.log(
      `Original collage size: ${(sizeOriginal / 1024).toFixed(2)} KB`
    );
    assert(size240 < sizeOriginal, "240x240 should be smaller than original");
    console.log("✅ File size comparison verified\n");

    // Test 5: Verify all tiles are 240x240 in the 240x240 collage
    console.log("Test 5: Verify PNG format and integrity");
    const format240 = metadata240.format;
    const formatOriginal = metadataOriginal.format;
    assert.strictEqual(
      format240,
      "png",
      `Expected PNG format, got ${format240}`
    );
    assert.strictEqual(
      formatOriginal,
      "png",
      `Expected PNG format, got ${formatOriginal}`
    );
    console.log("✅ Both collages are valid PNG format\n");

    // Test 6: Create 2-column layout (should be exactly 240x240 final size)
    console.log("Test 6: Create 240x240 collage with 2 columns");
    const collage2Col = await createCollage(
      files.map((f) => path.join(testAssetsDir, f)),
      2,
      "line-protocol"
    );

    const metadata2Col = await sharp(collage2Col).metadata();
    console.log(
      `Generated collage dimensions: ${metadata2Col.width} x ${metadata2Col.height}`
    );
    console.log(`Expected: 240 x 240 (scaled final size)`);

    assert.strictEqual(
      metadata2Col.width,
      240,
      `Expected width 240, got ${metadata2Col.width}`
    );
    assert.strictEqual(
      metadata2Col.height,
      240,
      `Expected height 240, got ${metadata2Col.height}`
    );
    console.log("✅ 2-column collage scaled to 240x240\n");

    // Test 7: Create 4-column layout (should be exactly 240x240 final size)
    console.log("Test 7: Create 240x240 collage with 4 columns");
    const collage4Col = await createCollage(
      files.map((f) => path.join(testAssetsDir, f)),
      4,
      "line-protocol"
    );

    const metadata4Col = await sharp(collage4Col).metadata();
    console.log(
      `Generated collage dimensions: ${metadata4Col.width} x ${metadata4Col.height}`
    );
    console.log(`Expected: 240 x 240 (scaled final size)`);

    assert.strictEqual(
      metadata4Col.width,
      240,
      `Expected width 240, got ${metadata4Col.width}`
    );
    assert.strictEqual(
      metadata4Col.height,
      240,
      `Expected height 240, got ${metadata4Col.height}`
    );
    console.log("✅ 4-column collage scaled to 240x240\n");

    console.log("✨ All tests passed! ✨\n");
    console.log("Summary:");
    console.log(`- Test images: ${files.length}`);
    console.log(
      `- 1-col 240x240: ${metadata240.width}x${metadata240.height} (${(
        size240 / 1024
      ).toFixed(2)} KB)`
    );
    console.log(
      `- 1-col original: ${metadataOriginal.width}x${
        metadataOriginal.height
      } (${(sizeOriginal / 1024).toFixed(2)} KB)`
    );
    console.log(
      `- 2-col 240x240: ${metadata2Col.width}x${metadata2Col.height}`
    );
    console.log(
      `- 4-col 240x240: ${metadata4Col.width}x${metadata4Col.height}`
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Helper function to create collage
async function createCollage(imagePaths, cols, mode) {
  const cols_num = parseInt(cols) || 1;
  const rows = Math.ceil(imagePaths.length / cols_num);

  // Get image metadata
  const imageMetadata = [];
  for (const imagePath of imagePaths) {
    try {
      const metadata = await sharp(imagePath).metadata();
      imageMetadata.push({ path: imagePath, ...metadata });
    } catch (err) {
      console.error(`Error reading ${imagePath}:`, err);
    }
  }

  if (imageMetadata.length === 0) {
    throw new Error("No valid images to process");
  }

  // Determine tile size
  const tileWidth =
    mode === "line-protocol"
      ? 240
      : Math.max(500, ...imageMetadata.map((img) => img.width || 0));
  const tileHeight =
    mode === "line-protocol"
      ? 240
      : Math.max(500, ...imageMetadata.map((img) => img.height || 0));

  const canvasWidth = tileWidth * cols_num;
  const canvasHeight = tileHeight * rows;

  // Build overlays
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

  // Create collage
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
  if (mode === "line-protocol") {
    collageBuffer = await sharp(collageBuffer)
      .resize(240, 240, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255 },
      })
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();
  }

  // Save to test output
  const filename = `collage-${mode}-${cols}col-${Date.now()}.png`;
  const filepath = path.join(testOutputDir, filename);
  await fs.promises.writeFile(filepath, collageBuffer);

  console.log(`  Saved: ${filename}`);
  return filepath;
}

// Run tests
runTests();
