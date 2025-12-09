# Adding Screenshot to README

To add the screenshot image to the README:

1. Save the screenshot image (the one showing the Image Collage Maker interface) to:
   `/Users/user/Desktop/devspace/image_collage/docs/screenshot.png`

2. Then run these commands:
   ```bash
   cd /Users/user/Desktop/devspace/image_collage
   git add docs/screenshot.png
   git commit -m "Add screenshot thumbnail to README"
   git push
   ```

The README.md already references this image at the top:
```markdown
![Image Collage Maker Screenshot](./docs/screenshot.png)
```

Once you save the image file and push, it will display on GitHub!
