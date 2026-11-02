---
title: Aquamania
summary: A scuba diving exploration game on Roblox, built around the awe and the fear of the underwater world. Alpha.
year: 2026
tags: [roblox, game, systems]
order: 2
layout: showcase
banner: /images/aquamania/header-1920.webp
robloxUrl: https://www.roblox.com/games/17810134766/Aquamania
story:
  - title: Quality on Roblox
    body: >-
      Aquamania is my attempt at making something of quality on a platform that, I felt, lacked it for a long time.
      It is a scuba diving exploration game, and I try to put as much care as I can into every detail of the dive.
    images:
      - src: /images/aquamania/sunlit-seagrass
        alt: A diver walking on pale sand next to tall seagrass, with sunlight breaking through the surface above.
        caption: Sunlight and seagrass
  - title: Awe and fear
    body: >-
      What I care about most is the vibe and the ambiance of exploring underwater. The player should feel the vibrant
      awe of the submarine world and, at the same time, be a little afraid of it. The visual and sound effects are
      designed to be cohesive, so every place feels like it belongs to the same ocean.
    images:
      - src: /images/aquamania/sunken-pier
        alt: A dark sunken pier on stone columns, covered in shells, in thick green water.
        caption: A sunken pier
      - src: /images/aquamania/crystal-field
        alt: A diver floating between tall translucent crystals in a purple haze, with the game's oxygen and stamina gauges on screen.
        caption: Crystal field
  - title: Regions, transitions and state
    animation: regions
    visualLabel: Illustration. A diver crosses three regions; in the zones between them the light and the sound blend from one region's values to the next.
    body: >-
      Behind the mood sits a lot of engine work: complex regions, transitions and state tracking. They keep track of
      where the player is and what that place should look and sound like, and they carry the player from one ambiance
      to the next instead of switching abruptly. That is what generates the visual and audio effects you see and hear.
    images:
      - src: /images/aquamania/lava-canyon
        alt: A diver swimming through a red canyon with glowing lava on the floor.
        caption: Lava canyon
  - title: Data that migrates itself
    animation: serializer
    visualLabel: Illustration. An older save is read into a newer schema; matching fields carry over, a new field gets a default and a removed one is left behind.
    body: >-
      Player data goes through a dynamic serializer and deserializer. When I make a small adjustment to the data
      schema, I don't have to write a migration by hand for it: old saves adapt to the new shape by themselves.
      It sounds minor, but it removes a whole class of chores and mistakes while the game keeps changing.
  - title: Still in alpha
    body: >-
      Aquamania is still in alpha, so it is a work in progress and keeps evolving. You can dive in and see where it
      stands today.
    link:
      label: Play Aquamania on Roblox
      href: https://www.roblox.com/games/17810134766/Aquamania
galleryTitle: More from the dive
gallery:
  - src: /images/aquamania/night-dunes
    alt: A diver in a red flowered shirt standing on pale dunes under a starry night sky.
    caption: Night dunes
  - src: /images/aquamania/blue-depths
    alt: A diver with orange fins drifting between dark stone spires in deep blue water.
    caption: Blue depths
  - src: /images/aquamania/white-cave
    alt: A diver swimming into a cave of bright, jagged white rock.
    caption: White cave
  - src: /images/aquamania/under-the-pier
    alt: A diver crouching under the columns of a sunken pier, next to seagrass and a mound of sand.
    caption: Under the pier
---

Aquamania is a scuba diving exploration game on Roblox, still in alpha. This page walks through what I was aiming for and the systems that make it work, with a few screenshots along the way. Click any picture to see it larger.
