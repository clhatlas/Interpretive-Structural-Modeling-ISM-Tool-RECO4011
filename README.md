This repository contains the ISM Tool, a browser-based application for building Interpretive Structural Models (ISM) from a set of factors and their pairwise relationships.

## Overview

The ISM Tool helps researchers, students, and practitioners apply Interpretive Structural Modelling by guiding them from an initial list of elements through to a hierarchical digraph and reachability matrix. It is deployed as a static web app and can be accessed at: https://ismtool-clh.netlify.app/.

Core capabilities include:
- Entering and editing a list of system factors or variables.
- Building a Structural Self-Interaction Matrix (SSIM) using pairwise relationships.
- Automatically converting the SSIM into an initial and final reachability matrix.
- Deriving hierarchical levels and visualizing the resulting ISM structure.

## Features

- Interactive SSIM editor to capture contextual relationships between variables (e.g. leads to, influences, contributes to).
- Automated computation of:
  - Initial reachability matrix.
  - Final reachability matrix after transitivity checks.
  - Level partitioning for all elements.
- Visual ISM representation showing multi-level hierarchical structure.
- Runs fully in the browser with no backend server required.

## Getting Started

To use the online version:
1. Open the live app: https://ismtool-clh.netlify.app/.
2. Define your list of elements (e.g. drivers, barriers, criteria).
3. Fill in the SSIM by specifying the directional influence between each pair.
4. Generate the reachability matrices and levels, then review the ISM graph produced by the tool.

## Local Development

If you want to run or modify the ISM Tool locally:

1. Clone the repository:
   - `git clone https://github.com/<your-username>/<your-repo-name>.git`  
   - `cd <your-repo-name>`  
2. Install dependencies (example for a typical JS front-end project):
   - `npm install`  
3. Start a development server:
   - `npm run dev` or `npm start` (depending on your setup).
4. Open the local URL printed in the terminal in your browser.

To create a production build:
- `npm run build`  
- Deploy the generated build folder to Netlify or any static hosting service.

## Tech Stack

- Front-end: Modern JavaScript and browser APIs (e.g. React/Vue/vanilla JS depending on project setup).
- Hosting: Netlify static site hosting.

You can connect the repository to Netlify for continuous deployment, so that every push to your main branch triggers a new deploy of the ISM Tool.

## Use Cases

The ISM Tool is suitable for:
- Academic research that needs to structure complex systems into hierarchical models.
- Decision-making studies where relationships among drivers, barriers, or criteria must be clarified.
- Teaching ISM concepts in workshops or university courses. [1][2]

## Contributing

Contributions that improve usability, add export options, enhance visualization, or refine the ISM workflow are welcome. Typical ways to contribute:
- Reporting bugs or suggesting enhancements via GitHub Issues.
- Submitting pull requests for code improvements or documentation updates.

Before submitting a pull request, ensure that:
- The code builds without errors.
- New functionality is documented in this README or inline comments.

## License

Add your chosen license here (for example, MIT, Apache-2.0, or another suitable open-source license) and include the corresponding LICENSE file in the repository.

All Rights Reserved - @clh.atlas 2025
[17] ism https://github.com/ism
[18] Hydrogen on Netlify https://docs.netlify.com/build/frameworks/framework-setup-guides/hydrogen/
[19] JuergenOrth/ISMtools 简介: Tools for using ISM REST-API https://www.github-zh.com/projects/468717690-ismtools
[20] Split Testing | Netlify Docs https://docs.netlify.com/manage/monitoring/split-testing/
