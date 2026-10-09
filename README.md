# Immiscible Diffusion Policy — project website

Official project website for **Immiscible Diffusion Policy: Preserving Multimodal Robot Actions through Label-Free Noise Assignment**, under review for ICRA 2027.

This is a standalone static website for `https://immiscible-diffusion-policy.github.io/`. It does not depend on a personal GitHub Pages website, a build service, or a JavaScript framework.

## Preview over SSH

On the remote machine:

```bash
cd /home/xiao/immiscible_diffusion/immiscible-diffusion-policy.github.io
python serve.py --port 8765
```

On your **laptop**, open another terminal and forward the port using the same SSH host (and any SSH options) you normally use:

```bash
ssh -N -L 8765:127.0.0.1:8765 xiao@YOUR_SSH_HOST
```

Replace `YOUR_SSH_HOST` with your server address or SSH-config alias. Keep both terminals running, then open **http://localhost:8765/** in the laptop's browser. If using an SSH alias that already specifies the username, use that alias by itself instead of `xiao@YOUR_SSH_HOST`.

Alternatively, in VS Code connected through Remote SSH, open the **Ports** panel, forward port **8765**, and open its forwarded address.

The preview server listens only on the remote machine's loopback interface. It supports HTTP byte ranges so visitors can seek within the video. If port 8765 is already serving this site, reuse that server. Stop the server or tunnel with Ctrl+C when finished reviewing. If laptop port 8765 is busy, use `-L 8766:127.0.0.1:8765` and browse to `http://localhost:8766/`.

## Page structure

Title, authors, and demo video → problem and motivation → observed modality collapse → method → experimental setup → results (task comparisons, Figure 5, then Table I) → conclusion → code and citation. This follows the narrative progression of the reference academic project page while retaining the project’s own styling.

## Files and editing

- `index.html`: paper title, authors, affiliations, explanations, figures, full results table, and citation.
- `styles.css`: responsive layout and styling; no external fonts or UI dependencies.
- `app.js`: task selection, looping rollouts, section reveals on scroll, and citation copying.
- `data/results.json`: paper Table I expert data proportions, rollout means, standard errors, and evaluation scope for seven tasks. These are published summary results, not training datasets.
- `assets/`: paper, original figures and rendered PNGs, logos, and demonstration videos.
- `citation.bib`: downloadable citation.
- `serve.py`: local preview utility; not required by GitHub Pages.
- `.nojekyll`: serves the repository as plain static files on GitHub Pages.

If updating numerical results, update **both** `data/results.json` and the HTML results table, along with any affected prose. The `modalities` and `modalityDescription` fields name the physical behaviors for each task (paper Section V-A; arm/rotation definitions also checked against the task code). The separate `frequencyLabels` and `frequencyNote` fields describe Table I’s vanilla-frequency ordering. These aggregate groups are not fixed physical identities across seeds; do not relabel their percentages as left/right or clockwise/counterclockwise without the corresponding per-seed mapping. The page reports task success alongside modality frequency, including lower success rates in some comparisons. Humanoid results use one training seed per task.

Sections gently appear as they enter the viewport. Section reveals and chart transitions respect reduced-motion preferences; all sections remain visible without JavaScript. The method and humanoid figures are presented without extra buttons or PDF links. Figure 5 and the complete results table are displayed directly on the page, without collapsible sections. Detailed means, standard errors, and frequency ordering notes appear in the table rather than beneath each chart. Figure 2 is not included on the website. The full video appears immediately below the paper header and affiliation logos.

## Asset sources

- `assets/pusht_scene_initial.svg`: supplied experimental starting scene, copied unchanged. The `pusht_clockwise.svg` and `pusht_counterclockwise.svg` diagrams reuse its exact object, target, and pusher geometry and add illustrative pushing paths beside the overview text. The paths are schematic, not measured rollouts.

- Paper and Figures 1, 3, 4, and 5: supplied by the paper authors. Figure PNGs were rendered from the supplied PDFs.
- `assets/demo.mp4`: supplied `Final_Immiscible Diffusion Policy Demo.mp4`, remuxed for browser streaming without re-encoding the main video or audio.
- `assets/rollouts/`: seven looping GIFs and first-frame PNGs, plus a silent looping video grid of nine vanilla Push T rollouts. The collapse grid is cropped from the vanilla half of the supplied demonstration and plays only while visible; reduced motion settings show a still frame. `sources.json` records source timestamps, crop rectangles, frame rate, and playback speed as shown in the supplied demo. The selected GIF loops automatically while visible and stops when outside the viewport. Reduced motion settings show a still frame.
- Task illustrations: original paper Figures 3 and 4. No extracted video screenshots are used as quantitative-result images. Each simulation task tab shows one cropped rollout GIF from the Immiscible half of the supplied demo. Each humanoid task GIF shows five consecutive rollout rounds before looping, including resets between rounds. The clips exclude comparison panels and numerical overlays; their still frames support reduced motion settings and previews outside the viewport.
- Princeton wordmark: author-supplied `University-of-Princeton-Logo.png`, copied unchanged, including the university name.
- Berkeley wordmark: [logo asset on the CLIFT project page](https://thomaschen98.github.io/clift/static/images/logo_berkeley.svg).
- UT Austin wordmark: [University of Texas at Austin website asset](https://www.utexas.edu/themes/coresite/coretheme/images/logo.svg).

Institutional logos retain their owners' rights. This repository does not grant a separate license to those marks.

## Publish after reviewing

The configured remote should be:

```text
https://github.com/immiscible-diffusion-policy/immiscible-diffusion-policy.github.io.git
```

Review and run these commands yourself from this website directory:

```bash
git status
git remote -v
git add index.html styles.css app.js assets data citation.bib README.md serve.py .gitignore .nojekyll
git diff --cached --stat
git commit -m "Add Immiscible Diffusion Policy project website"
git push -u origin main
```

In the GitHub repository, open **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/ (root)**. After GitHub finishes deployment, the site is available at `https://immiscible-diffusion-policy.github.io/`.

For subsequent edits, preview again, stage the intended changes, commit them, and push to `main`. No publication is performed by the local preview server.
