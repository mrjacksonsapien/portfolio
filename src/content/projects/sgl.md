---
title: SGL
summary: A software 3D rasterizer in JavaScript with no GPU, written to learn how 3D graphics really work.
year: 2025
tags: [javascript, 3d, math]
order: 1
repoUrl: https://github.com/mrjacksonsapien/SGL
demo: sgl
story:
  - title: One point, then three, then a cube
    visual: mesh
    visualLabel: A single vertex becomes a triangle, then a rotating cube made of twelve triangles.
    body: >-
      Everything in 3D starts with a vertex: three numbers, x, y and z. Connect three of them and you have a
      triangle, the only shape the whole pipeline knows how to draw. A cube is just 8 vertices and 12 triangles.
      A model with a million polygons is the same idea, repeated.
  - title: Moving things around with matrices
    visual: transform
    visualLabel: A square being scaled, rotated and moved by a matrix whose numbers change live.
    body: >-
      Every mesh is described around its own origin. To place it in the scene, SGL multiplies each vertex by a matrix
      that scales, rotates and moves it. Moving the camera is the same trick in reverse: the whole world is multiplied
      by a view matrix so the camera ends up at the origin. This is where a matrix stopped being a grid of numbers for
      me. Its columns are simply where the axes end up.
  - title: Throwing away what you can't see
    visual: culling
    visualLabel: A triangle rotating; it is drawn when it faces the camera and dashed and discarded when it faces away.
    body: >-
      On a closed object, a triangle seen from behind is hidden anyway, so why spend time on it? The order of a
      triangle's vertices decides which side is the front. As it turns away, the sign of its area flips, and SGL drops
      it before doing any more work.
  - title: Perspective is just a division
    visual: projection
    visualLabel: Side view of a camera frustum; an object of fixed size slides away and its projection on the near plane shrinks.
    body: >-
      The projection matrix prepares each point so that a final division by its distance does the rest. That one
      division is why far things look small and why parallel lines meet at the horizon. After it, every visible point
      lives in a tidy box from -1 to 1, which is then stretched to the pixels of the canvas.
  - title: Cutting at the near plane
    visual: clipping
    visualLabel: A triangle sliding through the near plane; only the part in front of it is kept.
    body: >-
      That division breaks for anything at or behind the camera. So a triangle that crosses the near plane is cut
      there: SGL keeps the part in front and builds new triangles from the points where the edges meet the plane.
  - title: Painting pixels, one at a time
    visual: raster
    visualLabel: A pixel grid being scanned row by row; two overlapping triangles fill it and the nearer one wins.
    body: >-
      Finally, the screen. For every pixel near a triangle, three edge functions tell whether its center is inside.
      When two triangles overlap, a depth buffer remembers the closest depth seen at each pixel, so the nearest one
      wins no matter the drawing order. A GPU does this in parallel. SGL does it in a loop, which is slow and, I
      think, the best way to see exactly what is happening.
  - title: What I learned
    body: >-
      I started SGL to understand the math behind 3D, not to ship a renderer. Writing the pipeline by hand forced me
      to meet matrices, coordinate spaces and projection head on.
      I came to linear algebra properly afterwards. Having built the pipeline first meant the theory arrived with
      something to attach to: matrix multiplication, change of basis and homogeneous coordinates were things I had
      already used before I could name them.
  - title: RustSGL
    body: >-
      The same idea rebuilt in Rust. Where SGL is about learning linear algebra, RustSGL is about performance.
    link:
      label: RustSGL on GitHub
      href: https://github.com/mrjacksonsapien/RustSGL
---

SGL (Sequential Graphic Library) is a 3D renderer that never touches the GPU. Every vertex, every triangle and every pixel is computed one after the other on the CPU, in plain JavaScript. The canvas only puts the finished pixels on screen. The scene above is rendered by SGL itself, loaded live from the `main` branch of the repository.

It was never meant to be fast. It is meant to be readable: each step of the 3D pipeline is its own function you can follow from top to bottom. This page walks through those steps.
