const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Test file verification
async function verifyDownload() {
  console.log("🔍 Verifying downloaded file integrity...\n");

  const testFile =
    "/Users/user/Desktop/devspace/image_collage/output/collage-line-protocol-1765299550699.png";

  try {
    // Check if file exists
    if (!fs.existsSync(testFile)) {
      console.error(`❌ File not found: ${testFile}`);
      return;
    }

    const stats = fs.statSync(testFile);
    console.log(`✅ File exists`);
    console.log(`   Path: ${testFile}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB\n`);

    // Get image metadata
    const metadata = await sharp(testFile).metadata();
    console.log(`✅ Image metadata:`);
    console.log(`   Format: ${metadata.format}`);
    console.log(`   Width: ${metadata.width} px`);
    console.log(`   Height: ${metadata.height} px`);
    console.log(`   Channels: ${metadata.channels}\n`);

    // Verify dimensions match expected (4 cols × 5 rows × 240px)
    const expectedWidth = 960; // 4 × 240
    const expectedHeight = 1200; // 5 × 240

    if (
      metadata.width === expectedWidth &&
      metadata.height === expectedHeight
    ) {
      console.log(`✅ Dimensions are CORRECT:`);
      console.log(`   Expected: ${expectedWidth} x ${expectedHeight}`);
      console.log(`   Actual: ${metadata.width} x ${metadata.height}\n`);
    } else {
      console.error(`❌ Dimensions are WRONG:`);
      console.error(`   Expected: ${expectedWidth} x ${expectedHeight}`);
      console.error(`   Actual: ${metadata.width} x ${metadata.height}\n`);
    }

    // Check file integrity by reading buffer
    const buffer = fs.readFileSync(testFile);
    const png_sig = buffer.slice(0, 8).toString("hex");
    const expected_sig = "89504e470d0a1a0a"; // PNG signature

    if (png_sig === expected_sig) {
      console.log(`✅ PNG signature is valid\n`);
    } else {
      console.error(`❌ PNG signature is invalid\n`);
    }

    // List all output files
    console.log("📁 All files in output folder:");
    const outputDir = "/Users/user/Desktop/devspace/image_collage/output";
    const files = fs.readdirSync(outputDir).sort();
    files.forEach((file) => {
      const filepath = path.join(outputDir, file);
      const fileStats = fs.statSync(filepath);
      console.log(`   ${file} (${(fileStats.size / 1024).toFixed(1)} KB)`);
    });
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.error(error.stack);
  }
}

verifyDownload();
