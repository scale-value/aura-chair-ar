/**
 * AURA LIVING - 3D Chair & AR Viewer Controller
 * Integrates with Google <model-viewer> API, WebXR, Scene Viewer, Quick Look,
 * PBR material customization, lighting environments, and mobile AR QR code generation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Core Elements
  const viewer = document.getElementById('chairViewer');
  const loadingProgress = document.getElementById('loadingProgress');
  const progressBar = document.getElementById('progressBar');
  const gestureHint = document.getElementById('gestureHint');

  // UI Panels & Controls
  const configPanel = document.getElementById('configPanel');
  const btnOpenDrawer = document.getElementById('btnOpenDrawer');
  const btnClosePanel = document.getElementById('btnClosePanel');
  const modelSelect = document.getElementById('modelSelect');

  // Material & Color Customizer
  const activeColorBadge = document.getElementById('activeColorName');
  const activeWoodBadge = document.getElementById('activeWoodName');
  const variantPills = document.querySelectorAll('.variant-pill');
  const swatchButtons = document.querySelectorAll('.swatch-btn');
  const legButtons = document.querySelectorAll('.leg-btn');

  // Lighting & Environment
  const lightButtons = document.querySelectorAll('.light-btn');
  const exposureSlider = document.getElementById('exposureSlider');
  const shadowSlider = document.getElementById('shadowSlider');
  const exposureVal = document.getElementById('exposureVal');
  const shadowVal = document.getElementById('shadowVal');

  // Toolbar & Camera
  const cameraButtons = document.querySelectorAll('.camera-presets .tool-btn');
  const btnAutoRotate = document.getElementById('btnAutoRotate');
  const btnToggleHotspots = document.getElementById('btnToggleHotspots');
  const btnSnapshot = document.getElementById('btnSnapshot');

  // Modals & Popups
  const btnOpenQR = document.getElementById('btnOpenQR');
  const btnCloseQR = document.getElementById('btnCloseQR');
  const qrModal = document.getElementById('qrModal');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const mobileUrlInput = document.getElementById('mobileUrlInput');
  const btnCopyUrl = document.getElementById('btnCopyUrl');

  const btnToggleSpecs = document.getElementById('btnToggleSpecs');
  const btnCloseSpecs = document.getElementById('btnCloseSpecs');
  const specsModal = document.getElementById('specsModal');
  const toast = document.getElementById('toastNotification');

  let hotspotsVisible = true;
  let isAutoRotating = false;

  // Local IP address detected during runtime setup
  const LOCAL_HOST_IP = '192.168.1.39';

  /* ==========================================================================
     1. Loading Progress & Initial Setup
     ========================================================================== */
  viewer.addEventListener('progress', (event) => {
    const progress = event.detail.totalProgress * 100;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      setTimeout(() => {
        loadingProgress.classList.add('hidden');
      }, 300);
    }
  });

  viewer.addEventListener('load', () => {
    loadingProgress.classList.add('hidden');
    showToast('3D PBR Model Ready for Interaction & AR');

    // Fade out initial interaction hint after 6 seconds
    setTimeout(() => {
      if (gestureHint) gestureHint.style.opacity = '0';
    }, 6000);
  });

  // Display Toast Notification Helper
  function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('active');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

  /* ==========================================================================
     2. Model Switching (Lounge Chair vs Velvet Sofa)
     ========================================================================== */
  const hotspotWidthBtn = document.querySelector('[slot="hotspot-dim-width"]');
  const annotWidthVal = document.getElementById('annotWidthVal');

  const modelConfigs = {
    SheenChair: {
      src: 'assets/models/SheenChair.glb',
      orbit: '35deg 78deg 2.2m',
      title: 'Veluto Armchair (Wide Sitting: 38.7" / +3" each side)',
      hotspotPos: '0.49m 0.35m 0.05m',
      widthText: '98 cm (38.7")',
      specs: {
        width: '98 cm (38.7 in) [+3" each side]',
        height: '69 cm (27.2 in)',
        depth: '57 cm (22.4 in)',
        seatHeight: '42 cm (16.5 in)'
      },
      hasVariants: true
    },
    SheenChairWideSeat: {
      src: 'assets/models/SheenChair_wide_seat.glb',
      orbit: '35deg 78deg 2.2m',
      title: 'Veluto Armchair (Cushion-Only Extended: 38.7")',
      hotspotPos: '0.49m 0.35m 0.05m',
      widthText: '98 cm (38.7")',
      specs: {
        width: '98 cm (38.7 in) [Cushion Only]',
        height: '69 cm (27.2 in)',
        depth: '57 cm (22.4 in)',
        seatHeight: '42 cm (16.5 in)'
      },
      hasVariants: true
    },
    SheenChairOriginal: {
      src: 'assets/models/SheenChair_original.glb',
      orbit: '35deg 78deg 2.1m',
      title: 'Veluto Armchair (Original Classic: 32.7")',
      hotspotPos: '0.41m 0.35m 0.05m',
      widthText: '83 cm (32.7")',
      specs: {
        width: '83 cm (32.7 in)',
        height: '69 cm (27.2 in)',
        depth: '57 cm (22.4 in)',
        seatHeight: '42 cm (16.5 in)'
      },
      hasVariants: true
    },
    GlamVelvetSofa: {
      src: 'assets/models/GlamVelvetSofa.glb',
      orbit: '45deg 75deg 3.5m',
      title: 'Velvet Glamour Chaise Sofa',
      hotspotPos: '0.92m 0.40m 0.05m',
      widthText: '185 cm (72.8")',
      specs: {
        width: '185 cm (72.8 in)',
        height: '78 cm (30.7 in)',
        depth: '85 cm (33.5 in)',
        seatHeight: '45 cm (17.7 in)'
      },
      hasVariants: false
    }
  };

  modelSelect.addEventListener('change', (e) => {
    const selectedKey = e.target.value;
    const config = modelConfigs[selectedKey];
    if (!config) return;

    loadingProgress.classList.remove('hidden');
    progressBar.style.width = '15%';
    viewer.src = config.src;
    viewer.cameraOrbit = config.orbit;

    // Update width hotspot position & label
    if (hotspotWidthBtn && config.hotspotPos) {
      hotspotWidthBtn.setAttribute('data-position', config.hotspotPos);
    }
    if (annotWidthVal && config.widthText) {
      annotWidthVal.textContent = config.widthText;
    }

    // Toggle variant pills visibility if model doesn't support glTF variants
    const variantRow = document.querySelector('.variants-row');
    if (variantRow) {
      variantRow.style.display = config.hasVariants ? 'flex' : 'none';
    }

    showToast(`Loaded ${config.title}`);
  });

  /* ==========================================================================
     3. Material Customization (glTF Variants & PBR Base Colors)
     ========================================================================== */
  // Native glTF Variant switching
  variantPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      const variantName = btn.getAttribute('data-variant');
      variantPills.forEach((b) => b.classList.remove('active'));
      swatchButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (viewer.availableVariants && viewer.availableVariants.includes(variantName)) {
        viewer.variantName = variantName;
      }
      activeColorBadge.textContent = variantName;
      showToast(`Selected ${variantName}`);
    });
  });

  // Custom Designer BaseColor Factor Tinting
  swatchButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const colorName = btn.getAttribute('data-name');
      const rgb = JSON.parse(btn.getAttribute('data-rgb'));

      variantPills.forEach((b) => b.classList.remove('active'));
      swatchButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      applyFabricColor(rgb);
      activeColorBadge.textContent = colorName;
      showToast(`Custom Fabric: ${colorName}`);
    });
  });

  function applyFabricColor(rgb) {
    if (!viewer.model || !viewer.model.materials) return;
    
    // Find fabric materials in the model
    const fabricMaterials = viewer.model.materials.filter((m) =>
      m.name.toLowerCase().includes('fabric') || m.name.toLowerCase().includes('cushion') || m.name.toLowerCase().includes('velvet')
    );

    if (fabricMaterials.length > 0) {
      fabricMaterials.forEach((mat) => {
        mat.pbrMetallicRoughness.setBaseColorFactor([rgb[0], rgb[1], rgb[2], 1.0]);
      });
    } else if (viewer.model.materials.length > 0) {
      // Fallback: apply to primary material
      viewer.model.materials[0].pbrMetallicRoughness.setBaseColorFactor([rgb[0], rgb[1], rgb[2], 1.0]);
    }
  }

  // Wood Leg Finish Toggle
  legButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const finish = btn.getAttribute('data-wood');
      legButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (!viewer.model || !viewer.model.materials) return;
      const woodMaterials = viewer.model.materials.filter((m) =>
        m.name.toLowerCase().includes('wood') || m.name.toLowerCase().includes('leg')
      );

      if (finish === 'brown') {
        woodMaterials.forEach((m) => m.pbrMetallicRoughness.setBaseColorFactor([0.36, 0.23, 0.13, 1.0]));
        activeWoodBadge.textContent = 'Natural Walnut';
        showToast('Legs: Natural Walnut');
      } else {
        woodMaterials.forEach((m) => m.pbrMetallicRoughness.setBaseColorFactor([0.1, 0.1, 0.12, 1.0]));
        activeWoodBadge.textContent = 'Matte Espresso';
        showToast('Legs: Matte Espresso');
      }
    });
  });

  /* ==========================================================================
     4. Lighting & Environment Presets
     ========================================================================== */
  lightButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      lightButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const envType = btn.getAttribute('data-env');
      const exp = parseFloat(btn.getAttribute('data-exp'));
      const shadow = parseFloat(btn.getAttribute('data-shadow'));

      viewer.exposure = exp;
      viewer.shadowIntensity = shadow;
      exposureSlider.value = exp;
      shadowSlider.value = shadow;
      exposureVal.textContent = exp.toFixed(2);
      shadowVal.textContent = shadow.toFixed(1);

      if (envType === 'studio') {
        viewer.environmentImage = 'assets/environments/studio.hdr';
        viewer.toneMapping = 'neutral';
      } else if (envType === 'warm') {
        viewer.environmentImage = 'neutral';
        viewer.toneMapping = 'aces';
      } else if (envType === 'sunset') {
        viewer.environmentImage = 'assets/environments/studio.hdr';
        viewer.toneMapping = 'aces';
      } else if (envType === 'dramatic') {
        viewer.environmentImage = 'neutral';
        viewer.toneMapping = 'neutral';
      }
      showToast(`Lighting: ${btn.querySelector('span').textContent}`);
    });
  });

  exposureSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    viewer.exposure = val;
    exposureVal.textContent = val.toFixed(2);
  });

  shadowSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    viewer.shadowIntensity = val;
    shadowVal.textContent = val.toFixed(1);
  });

  /* ==========================================================================
     5. Camera Presets & Reset
     ========================================================================== */
  cameraButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      cameraButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const orbit = btn.getAttribute('data-orbit');
      if (orbit) {
        viewer.cameraOrbit = orbit;
        viewer.fieldOfView = '32deg';
      }
    });
  });

  /* ==========================================================================
     6. Toolbar Controls (Auto-Rotate, Hotspots, Snapshot, Drawer)
     ========================================================================== */
  // 360 Auto-Rotate
  btnAutoRotate.addEventListener('click', () => {
    isAutoRotating = !isAutoRotating;
    viewer.autoRotate = isAutoRotating;
    viewer.autoRotateDelay = 0;
    viewer.rotationPerSecond = '20deg';
    btnAutoRotate.classList.toggle('active', isAutoRotating);
    showToast(isAutoRotating ? '360° Turntable Active' : 'Turntable Stopped');
  });

  // Toggle Measurement Hotspots
  btnToggleHotspots.addEventListener('click', () => {
    hotspotsVisible = !hotspotsVisible;
    const hotspots = viewer.querySelectorAll('.view-hotspot');
    hotspots.forEach((h) => {
      if (hotspotsVisible) {
        h.classList.remove('hidden');
      } else {
        h.classList.add('hidden');
      }
    });
    btnToggleHotspots.classList.toggle('active', hotspotsVisible);
    showToast(hotspotsVisible ? 'Dimensions Visible' : 'Dimensions Hidden');
  });

  // High-Resolution Snapshot Capture
  btnSnapshot.addEventListener('click', async () => {
    showToast('Rendering High-Res Capture...');
    try {
      // Temporarily stop auto-rotation to get a crystal-clear frame
      const wasRotating = viewer.autoRotate;
      viewer.autoRotate = false;

      const dataUrl = viewer.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `AURA-Veluto-Chair-${Date.now()}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      if (wasRotating) viewer.autoRotate = true;
      showToast('Capture Downloaded to Device!');
    } catch (err) {
      console.error('Snapshot failed:', err);
      showToast('Snapshot capture error');
    }
  });

  // Customizer Drawer Toggle
  btnOpenDrawer.addEventListener('click', () => {
    configPanel.classList.toggle('collapsed');
  });

  btnClosePanel.addEventListener('click', () => {
    configPanel.classList.add('collapsed');
  });

  /* ==========================================================================
     7. Mobile AR QR Code Generator Modal
     ========================================================================== */
  function getAppMobileUrl() {
    const port = window.location.port ? `:${window.location.port}` : '';
    // If running on localhost or 127.0.0.1, use LAN IP so mobile devices on the same Wi-Fi can open it
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${LOCAL_HOST_IP}${port}${window.location.pathname}`;
    }
    return window.location.href;
  }

  function generateQRCode() {
    const targetUrl = getAppMobileUrl();
    mobileUrlInput.value = targetUrl;

    if (typeof qrcode !== 'undefined') {
      qrCodeContainer.innerHTML = '';
      const qr = qrcode(0, 'M');
      qr.addData(targetUrl);
      qr.make();
      qrCodeContainer.innerHTML = qr.createImgTag(5, 8);
    }
  }

  btnOpenQR.addEventListener('click', () => {
    generateQRCode();
    qrModal.classList.add('active');
  });

  btnCloseQR.addEventListener('click', () => {
    qrModal.classList.remove('active');
  });

  btnCopyUrl.addEventListener('click', () => {
    mobileUrlInput.select();
    navigator.clipboard.writeText(mobileUrlInput.value).then(() => {
      showToast('Link Copied to Clipboard!');
    }).catch(() => {
      showToast('Press Ctrl+C to copy');
    });
  });

  // Specifications Modal
  btnToggleSpecs.addEventListener('click', () => {
    specsModal.classList.add('active');
  });

  btnCloseSpecs.addEventListener('click', () => {
    specsModal.classList.remove('active');
  });

  // Close modals when clicking backdrop
  [qrModal, specsModal].forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });

  // Hotspot Click to Focus Camera
  const hotspots = viewer.querySelectorAll('.view-hotspot');
  hotspots.forEach((h) => {
    h.addEventListener('click', (e) => {
      const pos = h.getAttribute('data-position');
      if (pos) {
        viewer.cameraTarget = pos;
        showToast('Focused on Feature');
      }
    });
  });
});
