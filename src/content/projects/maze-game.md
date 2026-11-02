---
title: Maze game
summary: A maze on an 8x8 LED matrix, played with a joystick, running on an ESP32. Solve it and a hidden Wi-Fi network opens to hand you the code, in a fictional escape room.
year: 2025
tags: [iot, c, embedded]
order: 3
layout: showcase
background: circuit
banner: /images/maze-game/header-1920.webp
repoUrl: https://github.com/mrjacksonsapien/maze_game_with_captive_portal
galleryTitle: On the breadboard
story:
  - title: Locked in a bunker
    body: >-
      The setting is an escape room, and a fictional one: you are locked in a bunker and need the code that opens the
      door. Searching the room, you find a small circuit with a joystick and a tiny screen. Move the stick and a dot
      moves. Walk through a gap in the wall and you are in another room. It is a maze, and the way out of it is the
      way to the code.
    images:
      - src: /images/maze-game/prototype
        alt: A breadboard crowded with colorful jumper wires, an ESP32 board at the top and a joystick on the left, standing on a dark desk.
        caption: The whole prototype
        orientation: portrait
  - title: A maze on 64 LEDs
    body: >-
      The game is a very small cousin of Adventure on the Atari 2600: rooms joined by gaps in their walls, seen one
      room at a time. The prototype holds nine rooms of 8 by 8 with one forced path, but the engine is modular, so
      procedural generation can be added later. The joystick's two analog axes are read by the ESP32's analog to
      digital converter and mapped to -1, 0 or 1, and its button restarts the game. When the player walks out of the
      last room, the game is over.
    images:
      - src: /images/maze-game/matrix-maze
        alt: The lit LED matrix showing the walls of a room as a ring of red dots, with one dot inside for the player.
        caption: One room, one dot
        orientation: portrait
      - src: /images/maze-game/joystick-wiring
        alt: Wiring diagram of the joystick module connected to the ESP32 with five wires.
        caption: The joystick wiring
  - title: Bits in, light out
    animation: shift-register
    visualLabel: Illustration. A byte is sent one bit at a time on the data line, each one taken in on a clock pulse; a latch pulse then makes the eight outputs of the shift register change together.
    body: >-
      An 8x8 matrix needs 16 control lines, and I give it three of the ESP32's pins. Two 74HC595 shift registers turn
      that serial stream into parallel outputs, one for the rows and one for the columns. For each byte I put one bit
      at a time on the data pin with a shift and a mask, then pulse the clock so the register takes it in, and
      finally pulse the latch so all eight outputs change together. It is the most low-level part of the project, and
      the one I enjoyed the most.
  - title: Faster than the eye
    animation: matrix-scan
    visualLabel: Illustration. The matrix lights one column at a time, first in slow motion with a fading afterglow, then at real speed where the whole picture looks lit at once.
    body: >-
      Each LED has its positive side on a row and its negative side on a column, so only one column can be lit at any
      moment. A hardware timer lights each column for a millisecond, one after the other. The game itself only writes
      the picture into an 8 byte buffer, protected by a mutex because the timer and the game both touch it. Your eye
      does the rest: the whole picture looks lit at once.
  - title: A network that opens when you win
    animation: captive-portal
    visualLabel: Illustration. A phone joins the ESP32's Wi-Fi network, asks the DNS server for any name and gets the ESP32's own address, then requests the page and shows the code in a popup.
    body: >-
      When the game starts, the ESP32 runs a hidden Wi-Fi access point called "Bunker's code" that accepts no
      connection, next to an HTTP server and a DNS server. There is no internet: it is a closed network of two
      devices. Finding the exit makes the network visible and lets exactly one device in, while the matrix plays a
      Wi-Fi symbol. Once a phone connects, a check mark replaces it. The DNS server answers every name with the
      ESP32's own address, so the phone's system opens its captive portal popup, asks for the page and shows the code.
    images:
      - src: /images/maze-game/phone-wifi-list
        alt: An iPhone Wi-Fi list with the network "Bunker's code" circled in red among other networks.
        caption: The network appears
        orientation: portrait
      - src: /images/maze-game/phone-captive-portal
        alt: The phone's captive Wi-Fi popup showing a page titled "Bunker's code" with the code as a link.
        caption: The popup with the code
        orientation: portrait
  - title: The weak spot
    body: >-
      A real escape room would have a flaw: the next team, waiting outside, could see the network and join it before
      playing. Limiting the access point to one connection lowers the odds, and a room that blocks radio waves would
      remove the problem. That one is out of my hands, but I would rather name the limit than hide it.
  - title: Watch it run
    visualLabel: Demo video of the maze game running on the breadboard.
    body: >-
      A short demo: the player crosses the rooms with the joystick, finds the exit, and the matrix switches to the
      Wi-Fi symbol.
    video:
      id: NwlUFpkzXBA
      title: Maze game demo
      poster: /images/maze-game/matrix-maze
  - title: What it taught me
    body: >-
      This project was my way into IoT and computer engineering. A small chip has no forgiving runtime: three pins, a
      one millisecond tick, eight bytes of display memory. Every bit and every microsecond is a decision, and that
      sharpened my C more than any exercise did. It also made me hungrier for systems programming. I have always been
      curious about how computers really work under the hood, and here I touched that layer with my own hands. I want
      to go deeper.
    link:
      label: See the code on GitHub
      href: https://github.com/mrjacksonsapien/maze_game_with_captive_portal
gallery:
  - src: /images/maze-game/breadboard-lit
    alt: A close view of the breadboard from above, with the LED matrix lit in red among many jumper wires.
    caption: The matrix, lit
    orientation: portrait
  - src: /images/maze-game/matrix-wifi
    alt: The LED matrix showing the Wi-Fi symbol, an arch of red dots above a single dot.
    caption: Wi-Fi symbol
    orientation: portrait
  - src: /images/maze-game/matrix-check
    alt: The LED matrix showing a check mark made of red dots.
    caption: Connected
    orientation: portrait
---

A maze game on an 8x8 LED matrix, played with a joystick and running on an ESP32, written in C with ESP-IDF. Solving the maze unlocks a Wi-Fi network that gives you a code through a captive portal, all inside a fictional escape room. This page walks through how it works, and the animation behind it is the circuit itself. Click any picture to see it larger.

It started as a school project. The component code grew from course demos by Gabriel T. St-Hilaire, the DNS redirection is adapted from the open source wifi-captive-portal-esp-idf project, and the circuit follows Freenove's tutorials; the licences are in the repository.
