---
titulo: "The Heart in High Definition: 3D Platform Combines Light and Electricity to Unravel Arrhythmias"
categorias: [outreach, research]
---

## The Challenge of Mapping Electrical Chaos

Cardiac arrhythmias, such as atrial fibrillation, remain one of the great challenges of clinical electrophysiology. To treat these conditions — often with catheter ablation, which "burns" the source of the problem — it is essential to understand the complex dynamics of the heart's electrical activity.

Today, physicians use invasive electrical mapping (with catheters) or non-invasive mapping (such as electrodes on the chest). However, these methods face significant obstacles: low spatial resolution, dependence on the direction of wave propagation and interference from distant signals (*far-field* effects). The result is often an incomplete picture of the real electrophysiology, which can reduce the success of treatments.

But what if we could literally *see* electricity propagating from cell to cell?

## The Solution: Light, Cameras and Electricity

![](/noticias/2026-06-02-artigo-prof-salinet-2025-j-physio/figura1.jpg)

To overcome the limitations of current technologies, researchers at HEartLab (Universidade Federal do ABC), with support from international partners, created an unprecedented experimental platform, described in the British journal *The Journal of Physiology*. The system integrates three mapping modalities in isolated rabbit hearts:

1. **3D Panoramic Optical Mapping:** Using voltage-sensitive fluorescent dyes (Di-4-ANBDQPQ) and three high-speed cameras arranged at 120 degrees, the system captures transmembrane action potentials at high spatial resolution (500 frames per second) without touching the tissue.
2. **Epicardial Electrical Mapping:** Custom multi-electrode arrays (MEAs) attached directly to the surface of the atria and ventricles.
3. **"Torso-Tank" Model for ECGi:** The heart is immersed in a tank containing a solution that simulates the conductivity of the chest, fitted with 60 surface electrodes.

## The Computational Trick: Solving the "Inverse Problem"

From the standpoint of data extraction and computational modeling, the platform is a goldmine. Optical mapping directly measures the transmembrane cellular potential, while clinical electrodes measure the extracellular potential.

To connect these worlds, the study uses **Electrocardiographic Imaging (ECGi)**. By processing the "torso-tank" signals, the team reconstructs the epicardial electrograms by solving the Laplace equation in the conducting volume. Since this is an ill-posed inverse problem (in which small variations in the data can cause huge errors in the reconstruction), the scientists stabilized the system by applying zero-order Tikhonov regularization, optimized by the L-curve method.

![](/noticias/2026-06-02-artigo-prof-salinet-2025-j-physio/figura2.jpg)

In addition, the 3D geometry of the heart was reconstructed using interactive segmentation techniques and Poisson algorithms, allowing the 3D geometric mesh to be precisely aligned (projected) with the 2D optical data captured by the cameras.

## Results: Where the Clinic Meets the Cell

Tests in sinus rhythm, ventricular tachycardia and atrial fibrillation validated the integration of the system. During sinus rhythm and ventricular tachycardia, the propagation of the electrical and optical wavefronts showed strong agreement. Dominant Frequency (DF) analysis, extracted via the fast Fourier transform (FFT), also showed high correlation between the optical signals, the invasive electrical signals and those reconstructed from the tank.

However, during more chaotic atrial arrhythmias, small spatiotemporal differences emerged between the mapping strategies. And this is exactly where the value of this platform lies: by combining the very high resolution of optical mapping with the view of conventional electrodes, the researchers can understand the limitations of commercial mapping systems, offering an extremely detailed *test bed* for evaluating new antiarrhythmic drugs and improving ablation procedures.

To read the original article: [An integrated platform for 2-D and 3-D optical and electrical mapping of arrhythmias in Langendorff-perfused rabbit hearts](https://doi.org/10.1113/JP287815)

DOI: https://doi.org/10.1113/JP287815
