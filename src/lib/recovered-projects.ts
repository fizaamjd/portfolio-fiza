import type { Project } from "@/lib/data";

/** Distinct recovered projects; source collections are linked rather than duplicated. */
export const RECOVERED_PROJECTS: Project[] = [
  {
    "id": "planet1",
    "name": "Cosmic Resurgence",
    "kind": "project",
    "tagline": "A three-planet space-survival game built in Unity",
    "window": "2024",
    "stack": [
      "Unity",
      "C#",
      "3D",
      "Animation"
    ],
    "brief": "An astronaut survival game with three planet stages, key-gated spaceship transitions, oxygen pickups, shared health and lives, and an original introductory cutscene.",
    "findings": [
      "Built astronaut movement, rotation and a float-animation input using Unity’s input axes and Animator.",
      "Implemented shared health, survival and lives state in GameData, with oxygen-tank collisions replenishing health.",
      "Connected collectible keys to spaceship scene transitions across three planet stages, with menu, win and lose scenes.",
      "Preserved the original Windows build and cutscene. The public source archive documents imported assets separately; its original frame-based health drain remains a known coursework limitation."
    ],
    "metrics": [
      {
        "label": "Planet stages",
        "value": "3"
      },
      {
        "label": "Starting lives",
        "value": "3"
      }
    ],
    "repoUrl": "https://github.com/fizaamjd/Cosmic-Resurgence",
    "image": "/projects/cosmic-resurgence/Planet-1.jpg",
    "reel": "/motion/cosmic-resurgence-reel.html",
    "reelLength": "0:38",
    "reelAspect": 1.7777777777777777,
    "focus": [
      "systems",
      "frontend"
    ],
    "layer": "Games and foundations",
    "layerId": "foundations",
    "group": "foundations",
    "depth": 60,
    "headline": false
  },
  {
    "id": "dungeon",
    "name": "Unity Level Design",
    "kind": "project",
    "tagline": "Scene setup and level layout in Unity: a timed maze and an atmospheric set",
    "window": "2024",
    "stack": [
      "Unity",
      "C#",
      "Level design",
      "Lighting"
    ],
    "brief": "Two Unity scenes built for different reasons. A maze level blocked out as corridors and dead ends inside a boundary room, composed so the key, the exit and two pursuing enemies sit at deliberate distances from the entrance. A second scene dressed purely for mood: red directional light, tall tree meshes and angled panels placed to break sightlines.",
    "findings": [
      "Laid out the maze as a grid of corridors and dead ends, walled with box geometry and bounded by a timber room so the camera always has something behind the play space.",
      "Composed the scene hierarchy around the level: directional light, floor plane, boundary, two enemies, key, player, timer canvas, event system and game manager.",
      "Placed the key and the exit relative to the entrance and the longest dead end, so the sixty second countdown sets the difficulty rather than the enemy speed.",
      "Dressed a second scene from Unity primitives and four tree texture sets, lit in a single red key light with panels angled to catch it. Only the editor captures of that scene survive.",
      "Kept the behaviours small on purpose: movement across the XZ plane, pursuit, a key trigger, a destination trigger and a countdown drawn to an on-screen label."
    ],
    "metrics": [
      {
        "label": "Scenes",
        "value": "2"
      },
      {
        "label": "Countdown",
        "value": "60 s"
      }
    ],
    "repoUrl": "https://github.com/fizaamjd/Unity-Level-Design",
    "image": "/projects/level-design/poster.jpg",
    "reel": "/motion/level-design-reel.html",
    "reelLength": "0:34",
    "focus": [
      "systems"
    ],
    "layer": "Games and foundations",
    "layerId": "foundations",
    "group": "foundations",
    "depth": 60,
    "headline": false
  },
  {
    "id": "oopstore",
    "name": "Store Management",
    "kind": "project",
    "tagline": "An object-oriented Windows Forms store application",
    "window": "2023",
    "stack": [
      "C#",
      "Windows Forms",
      ".NET 4.7.2",
      "File I/O"
    ],
    "brief": "A desktop coursework application separating business objects, file persistence and Windows Forms interfaces for admin and customer workflows.",
    "findings": [
      "Organized user roles into base-user, admin and customer classes, with product, category and stock business objects.",
      "Built admin screens for adding stock, changing prices and quantities, reviewing inventory and deleting products.",
      "Added customer-facing shopping screens and local comma-separated file persistence.",
      "Published synthetic sample accounts only. Original plaintext authentication is documented as a historical local-demo limitation, not a production security design."
    ],
    "repoUrl": "https://github.com/fizaamjd/OOP-Projects/tree/main/store-management",
    "image": "/projects/store-management/poster.jpg",
    "reel": "/motion/store-management-reel.html",
    "reelLength": "0:35",
    "focus": [
      "frontend",
      "data"
    ],
    "layer": "Games and foundations",
    "layerId": "foundations",
    "group": "foundations",
    "depth": 60,
    "headline": false
  },
  {
    "id": "pacman",
    "name": "EZIO Fill",
    "kind": "project",
    "tagline": "A tank game: collect stars, fill the tank, survive the enemies",
    "window": "2023",
    "stack": [
      "C++",
      "Windows console",
      "GUI rebuild"
    ],
    "brief": "First written in C++ for the Windows console in first year, then rebuilt as a GUI game with sprites, which is what the demo shows. You drive a tank through a maze, collect stars to power it and fill it, and shoot your way past enemies that drain the power.",
    "findings": [
      "Each star adds 5 power, and every fourth one fills one of the tank's ten empty cells.",
      "Level 1 puts a gunner and a chaser on the field; a full tank and a score above 20 open level 2, a harder maze with a second gunner.",
      "Enemy bullets and the chaser take 1 power at a time and the run ends at zero. Space fires back, and every hit is worth 2 points.",
      "Stars spawn on a timer at random free cells, and the tank reads the characters ahead before it moves, so walls are just text in the maze file.",
      "The GUI version's source did not survive. The published code is the C++ console original, eziogame.cpp."
    ],
    "metrics": [
      {
        "label": "Tank cells",
        "value": "10"
      },
      {
        "label": "Levels",
        "value": "2"
      }
    ],
    "repoUrl": "https://github.com/fizaamjd/Cpp-Fundamentals/tree/main/additional-coursework/pacmangame/gameapplication",
    "image": "/projects/pacman/poster.jpg",
    "reel": "/motion/ezio-fill-reel.html",
    "reelLength": "0:30",
    "focus": [
      "systems"
    ],
    "layer": "Games and foundations",
    "layerId": "foundations",
    "group": "foundations",
    "depth": 60,
    "headline": false
  },
  {
    "id": "cppfundamentals",
    "name": "C++ Fundamentals",
    "kind": "project",
    "tagline": "Programming Fundamentals labs and Programming Day exercises",
    "window": "2022 - 2023",
    "stack": [
      "C++",
      "Console",
      "Algorithms",
      "File I/O"
    ],
    "brief": "A consolidated coursework archive organized by lab and Programming Day, including original exercises and recovered unique source files.",
    "findings": [
      "Preserved the original consolidated repository and its Git history.",
      "Compared recovered source after removing whitespace, adding 39 unique C++ files while skipping 153 duplicate translation units.",
      "Kept generated executables out of the recovered additions and documented platform and missing-data limitations."
    ],
    "metrics": [
      {
        "label": "Unique recovered files",
        "value": "39"
      },
      {
        "label": "Duplicates skipped",
        "value": "153"
      }
    ],
    "repoUrl": "https://github.com/fizaamjd/Cpp-Fundamentals",
    "focus": [
      "systems"
    ],
    "layer": "Games and foundations",
    "layerId": "foundations",
    "group": "foundations",
    "depth": 60,
    "headline": false
  }
];
