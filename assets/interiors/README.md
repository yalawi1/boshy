# Interior project drawings

Drop the board photos here with these exact filenames, and the Projects
section on `interiors.html` picks them up automatically:

| File                    | What it is                                              |
|-------------------------|---------------------------------------------------------|
| `thamra-plans.jpg`      | Thamra: furniture / zoning / colour / lighting plans + exterior elevation |
| `thamra-sections.jpg`   | Thamra: sections AA and BB, perspective, moodboard      |
| `seda-boards.jpg`       | SEDA: elevation, perspective, top view, sections, moodboards |

Any file that is missing simply shows a "Drawing coming soon" placeholder
instead of a broken image, so the page never looks broken.

Resize to about 1600px on the long edge before committing (keeps the repo light):

    sips -s format jpeg -s formatOptions 72 --resampleWidth 1600 input.jpg --out assets/interiors/thamra-plans.jpg
