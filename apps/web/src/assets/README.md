# Original application artwork

`meadow.svg` is project-original artwork from the local high-fidelity design. Its approved SHA-256 is `5a66fa35e587347e6e8faed34eb3fbd90de3cfd46d1407cc73268b611c8e8df6`. The runtime file preserves those exact bytes.

The compact activity illustrations in `ActivityArt` in `../features/course/CourseScreens.tsx` use the project-original high-fidelity `moduleArt` geometry, transcribed into static SVG elements. They depict activity tools without curriculum letters, words or expected oral answers.

The eight portraits in `avatars/` preserve the accepted original animal artwork. Extraction adds the SVG namespace for standalone image loading and one trailing newline. Every original element, attribute, color and its order stays exact. The source artwork SHA-256 is `fd092913f6f22c3ea5b2bc222a1153f2876398fcd4e139f620d6ce673d6c0807`.

| Animal | Runtime SVG SHA-256                                                |
| ------ | ------------------------------------------------------------------ |
| Rabbit | `c3dc48553045a01c8d5df36a610b6caab02bee70511c21cc85f170f5338aad1f` |
| Fox    | `6fd22fcd9cd8008f842869caf02ed9239014e3098060bfa3641d1307aa448f95` |
| Bear   | `f3c4cf628aa74ecc0eb488cf49d404700c0dbd0fe9e5c0b0297e37a088d90413` |
| Owl    | `0323da743b5254c09045bc497c894ea97178af784c32c9e807fbbe5fc29d0580` |
| Turtle | `395ec37522cbf7b22478ae7e173edf619ed4ae065bc371246a8236cf17520bde` |
| Bird   | `89f40404418e998cbf28e37a6dc653253da954c3e34d2c1bc53d97695b7f2d5a` |
| Frog   | `38c68653e758708c21c66d8c925bb2685325765662028bcdffde90816ce11a24` |
| Cat    | `805190d13e6a179d6871551385c5a2db5a4551a4c6e504530784ca80ed39c70e` |

Local Chromium comparison verifies all eight standalone portraits against the frozen accepted renders at 216 and 48 pixels. The 16 PNG outputs match exactly. This establishes asset parity; chooser accessibility and production screen integration require their own checks.

Reading.com screenshots informed visual composition only. No Reading.com screenshot or third-party artwork is bundled here. This artwork record does not grant publication approval for book curriculum or runtime content packages.
