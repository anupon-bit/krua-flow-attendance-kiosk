(() => {
  'use strict';

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const STEP_MAP = [
    { key: 'personal', label: 'ข้อมูลส่วนตัว', sectionIndexes: [1, 3, 4] },
    { key: 'work', label: 'ข้อมูลการทำงาน', sectionIndexes: [0, 2, 5] },
    { key: 'documents', label: 'เอกสารสำคัญ', sectionIndexes: [6, 7] },
    { key: 'review', label: 'ตรวจสอบและส่ง', sectionIndexes: [8] }
  ];

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    if (!copied) throw new Error('copy failed');
  }

  // Local QR Model 2 encoder: fixed Version 5-L, byte mode, mask 0.
  // This keeps the registration URL inside the browser and makes no QR API request.
  function makeQrMatrix(text) {
    const version = 5;
    const size = 17 + version * 4;
    const dataCodewords = 108;
    const eccCodewords = 26;
    const bytes = Array.from(new TextEncoder().encode(String(text || '')));
    if (bytes.length > 106) throw new Error('ลิงก์ยาวเกินกว่าจะสร้าง QR ในหน้านี้');

    const bits = [];
    const appendBits = (value, length) => {
      for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
    };
    appendBits(0x4, 4);
    appendBits(bytes.length, 8);
    bytes.forEach(value => appendBits(value, 8));
    for (let i = 0; i < Math.min(4, dataCodewords * 8 - bits.length); i += 1) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j += 1) value = (value << 1) | bits[i + j];
      data.push(value);
    }
    for (let pad = 0; data.length < dataCodewords; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);

    const exp = new Array(512).fill(0);
    const log = new Array(256).fill(0);
    let value = 1;
    for (let i = 0; i < 255; i += 1) {
      exp[i] = value;
      log[value] = i;
      value <<= 1;
      if (value & 0x100) value ^= 0x11d;
    }
    for (let i = 255; i < exp.length; i += 1) exp[i] = exp[i - 255];
    const multiply = (a, b) => (!a || !b ? 0 : exp[log[a] + log[b]]);
    let generator = [1];
    for (let degree = 0; degree < eccCodewords; degree += 1) {
      const next = new Array(generator.length + 1).fill(0);
      generator.forEach((coefficient, index) => {
        next[index] ^= coefficient;
        next[index + 1] ^= multiply(coefficient, exp[degree]);
      });
      generator = next;
    }
    const remainder = new Array(eccCodewords).fill(0);
    data.forEach(byte => {
      const factor = byte ^ remainder[0];
      remainder.shift();
      remainder.push(0);
      for (let i = 0; i < eccCodewords; i += 1) remainder[i] ^= multiply(generator[i + 1], factor);
    });
    const codewords = data.concat(remainder);

    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const functions = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFunction = (x, y, dark) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      modules[y][x] = Boolean(dark);
      functions[y][x] = true;
    };
    for (let i = 0; i < size; i += 1) {
      setFunction(6, i, i % 2 === 0);
      setFunction(i, 6, i % 2 === 0);
    }
    const drawFinder = (centerX, centerY) => {
      for (let dy = -4; dy <= 4; dy += 1) {
        for (let dx = -4; dx <= 4; dx += 1) {
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          setFunction(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
        }
      }
    };
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(30 + dx, 30 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    const reserveFormat = () => {
      for (let i = 0; i <= 5; i += 1) setFunction(8, i, false);
      setFunction(8, 7, false); setFunction(8, 8, false); setFunction(7, 8, false);
      for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, false);
      for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, false);
      for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, false);
      setFunction(8, size - 8, true);
    };
    reserveFormat();

    let bitIndex = 0;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vertical = 0; vertical < size; vertical += 1) {
        const y = upward ? size - 1 - vertical : vertical;
        for (let column = 0; column < 2; column += 1) {
          const x = right - column;
          if (functions[y][x]) continue;
          const source = bitIndex < codewords.length * 8
            ? (codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1
            : 0;
          modules[y][x] = Boolean(source ^ (((x + y) & 1) === 0 ? 1 : 0));
          bitIndex += 1;
        }
      }
      upward = !upward;
    }

    const formatData = 0x08; // Error correction L (01), mask 0 (000).
    let remainderBits = formatData;
    for (let i = 0; i < 10; i += 1) remainderBits = (remainderBits << 1) ^ (((remainderBits >>> 9) & 1) * 0x537);
    const formatBits = ((formatData << 10) | remainderBits) ^ 0x5412;
    const formatBit = index => ((formatBits >>> index) & 1) !== 0;
    for (let i = 0; i <= 5; i += 1) setFunction(8, i, formatBit(i));
    setFunction(8, 7, formatBit(6)); setFunction(8, 8, formatBit(7)); setFunction(7, 8, formatBit(8));
    for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, formatBit(i));
    for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, formatBit(i));
    for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, formatBit(i));
    setFunction(8, size - 8, true);
    return modules;
  }

  function renderQr(canvas, text) {
    if (!canvas || typeof canvas.getContext !== 'function') return false;
    const matrix = makeQrMatrix(text);
    const quiet = 4;
    const scale = 6;
    const dimension = (matrix.length + quiet * 2) * scale;
    canvas.width = dimension;
    canvas.height = dimension;
    canvas.setAttribute('aria-label', 'QR Code สำหรับลิงก์ลงทะเบียนพนักงาน');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, dimension, dimension);
    context.fillStyle = '#000';
    matrix.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    }));
    return true;
  }

  window.KruaFlowRegistrationUI = { copyText, makeQrMatrix, renderQr };

  function supportedFile(file, inputId) {
    if (!file || !file.size || file.size > MAX_FILE_BYTES) return false;
    const type = String(file.type || '').toLowerCase();
    const name = String(file.name || '').toLowerCase();
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(type) || /\.(jpe?g|png|webp|pdf)$/.test(name);
    if (!allowed) return false;
    return inputId !== 'photo' || (type !== 'application/pdf' && !/\.pdf$/.test(name));
  }

  function fieldComplete(element) {
    if (!element || element.disabled) return true;
    if (element.type === 'checkbox' || element.type === 'radio') return Boolean(element.checked);
    if (element.type === 'file') {
      const files = Array.from(element.files || []);
      return files.length > 0 && files.every(file => supportedFile(file, element.id));
    }
    return Boolean(String(element.value || '').trim()) && (!element.checkValidity || element.checkValidity());
  }

  function requiredElements(section) {
    return Array.from(section.querySelectorAll('input[required],select[required],textarea[required]'));
  }

  function hasAnyValue(section) {
    return Array.from(section.querySelectorAll('input,select,textarea')).some(element => {
      if (element.type === 'checkbox' || element.type === 'radio') return element.checked;
      if (element.type === 'file') return Boolean(element.files && element.files.length);
      return Boolean(String(element.value || '').trim());
    });
  }

  function installHero(main) {
    const hero = document.createElement('header');
    hero.className = 'kfEmployeeHero';
    hero.innerHTML = '<div><div class="kfEmployeeHeroBrand">KruaFlow <span>ระบบบุคลากร</span></div><h1>ลงทะเบียนพนักงานใหม่</h1><p>กรอกข้อมูลทีละขั้นและแนบเอกสารให้ครบ เพื่อส่งให้ Admin ตรวจสอบ</p></div><div class="kfMobileBadge">เหมาะสำหรับมือถือ</div>';
    main.insertBefore(hero, main.firstChild);
  }

  function decorateSections(sections) {
    sections.forEach((section, index) => {
      section.dataset.kfGroup = [0, 2, 5].includes(index) ? 'work' : [1, 3, 4].includes(index) ? 'personal' : index <= 7 ? 'documents' : 'consent';
      let heading = section.querySelector(':scope > h2');
      if (!heading) heading = section.querySelector(':scope > .docHead > h2');
      if (!heading && section.querySelector('#consent')) {
        heading = document.createElement('h2');
        heading.textContent = 'ยืนยันข้อมูล';
        section.insertBefore(heading, section.firstChild);
      }
      if (!heading) return;
      let header = heading.parentElement;
      if (header && header.classList.contains('docHead')) header.classList.add('kfSectionHeader');
      else {
        header = document.createElement('div');
        header.className = 'kfSectionHeader';
        heading.parentNode.insertBefore(header, heading);
        header.appendChild(heading);
      }
      if (!header.querySelector('.kfSectionStatus')) {
        const status = document.createElement('span');
        status.className = 'kfSectionStatus';
        status.textContent = 'ยังไม่ครบ';
        header.appendChild(status);
      }
    });
  }

  function labelOf(element) {
    const field = element.closest('.field');
    const label = field && field.querySelector('label');
    if (label) return label.textContent.replace('*', '').trim();
    if (element.id === 'consent') return 'การยืนยันข้อมูล';
    if (element.id === 'photo') return 'รูปถ่ายพนักงาน';
    return 'ข้อมูลที่จำเป็น';
  }

  function selectedLabel(id) {
    const element = document.getElementById(id);
    if (!element) return '—';
    if (element.tagName === 'SELECT') {
      const option = element.options[element.selectedIndex];
      return option && option.value ? option.text : '—';
    }
    return String(element.value || '').trim() || '—';
  }

  function fileSummary(id) {
    const element = document.getElementById(id);
    const files = Array.from(element && element.files || []);
    return files.length ? files.map(file => file.name).join(', ') : 'ยังไม่ได้แนบ';
  }

  function installWizard(form, sections, submitButton) {
    let activeStep = 0;
    const wizard = document.createElement('nav');
    wizard.className = 'kfWizard';
    wizard.setAttribute('aria-label', 'ขั้นตอนการลงทะเบียน');
    wizard.innerHTML = STEP_MAP.map((step, index) => '<button type="button" class="kfWizardStep" data-step="' + index + '"><span class="kfWizardDot">' + (index + 1) + '</span><span class="kfWizardLabel">' + escapeHtml(step.label) + '</span></button>').join('');
    form.insertAdjacentElement('beforebegin', wizard);

    const review = document.createElement('section');
    review.className = 'card kfReviewCard';
    review.innerHTML = '<div class="kfReviewTitle">ตรวจสอบข้อมูลก่อนส่ง</div><div class="kfReviewIntro">กด “แก้ไข” เพื่อย้อนกลับไปยังส่วนที่ต้องการ ข้อมูลในฟอร์มจะไม่หาย</div><div class="kfReviewList"></div>';
    sections[8].insertAdjacentElement('beforebegin', review);

    const controls = document.createElement('div');
    controls.className = 'kfWizardControls';
    controls.innerHTML = '<button type="button" class="kfBackBtn">ย้อนกลับ</button><button type="button" class="kfNextBtn">ถัดไป</button>';
    submitButton.parentNode.insertBefore(controls, submitButton);
    const error = document.getElementById('error');
    if (error) submitButton.parentNode.insertBefore(error, controls);

    const backButton = controls.querySelector('.kfBackBtn');
    const nextButton = controls.querySelector('.kfNextBtn');
    const stepButtons = Array.from(wizard.querySelectorAll('.kfWizardStep'));
    const stepSections = index => STEP_MAP[index].sectionIndexes.map(sectionIndex => sections[sectionIndex]).filter(Boolean);
    const firstInvalid = index => stepSections(index).flatMap(requiredElements).find(element => !fieldComplete(element)) || null;
    const stepComplete = index => !firstInvalid(index);

    function setError(message) {
      if (!error) return;
      error.textContent = message || '';
      error.classList.toggle('show', Boolean(message));
    }

    function validateStep(index) {
      const invalid = firstInvalid(index);
      if (!invalid) return true;
      const card = invalid.closest('.card');
      invalid.classList.add('kfFieldError');
      if (card) card.classList.add('kf-section-problem');
      setError('กรุณากรอกหรือแนบ “' + labelOf(invalid) + '” ให้ครบก่อนกดถัดไป');
      try { invalid.focus({ preventScroll: true }); } catch (_) { invalid.focus(); }
      invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    const reviewSpecs = [
      { title: 'ข้อมูลส่วนตัว', step: 0, ids: ['firstName','lastName','phone','birthDate','employeePin','employeePinConfirm'], summary: () => selectedLabel('firstName') + ' ' + selectedLabel('lastName') + ' · ' + selectedLabel('phone') },
      { title: 'ข้อมูลการทำงาน', step: 1, ids: ['branch','department','position'], summary: () => selectedLabel('branch') + ' / ' + selectedLabel('department') + ' · ' + selectedLabel('position') },
      { title: 'ที่อยู่', step: 0, ids: ['registeredAddress','currentAddress'], summary: () => selectedLabel('registeredAddress') },
      { title: 'ผู้ติดต่อฉุกเฉิน', step: 0, ids: ['emergencyName','emergencyPhone'], summary: () => selectedLabel('emergencyName') + ' · ' + selectedLabel('emergencyPhone') },
      { title: 'ข้อมูลธนาคาร', step: 1, ids: ['bankName','bankAccountNo','bankAccountName'], summary: () => selectedLabel('bankName') + ' · ' + selectedLabel('bankAccountNo') },
      { title: 'เอกสารสำคัญ', step: 2, ids: ['docIdCard','docHouse'], summary: () => 'บัตรประชาชน: ' + fileSummary('docIdCard') + ' · ทะเบียนบ้าน: ' + fileSummary('docHouse') },
      { title: 'รูปถ่ายพนักงาน', step: 2, ids: ['photo'], summary: () => fileSummary('photo') },
      { title: 'Consent', step: 3, ids: ['consent'], summary: () => document.getElementById('consent').checked ? 'ยืนยันการใช้ข้อมูลแล้ว' : 'ยังไม่ได้ยืนยันการใช้ข้อมูล' }
    ];

    function buildReview() {
      const list = review.querySelector('.kfReviewList');
      list.innerHTML = reviewSpecs.map((spec, index) => {
        const complete = spec.ids.every(id => fieldComplete(document.getElementById(id)));
        return '<div class="kfReviewRow"><strong>' + escapeHtml(spec.title) + '<span class="kfReviewState ' + (complete ? 'ok' : 'warn') + '">' + (complete ? '✓ ครบแล้ว' : '⚠ ยังไม่ครบ') + '</span></strong><div class="kfReviewSummary">' + escapeHtml(spec.summary()) + '</div><button type="button" data-review-edit="' + index + '">แก้ไข</button></div>';
      }).join('');
      list.querySelectorAll('[data-review-edit]').forEach(button => {
        button.onclick = () => showStep(reviewSpecs[Number(button.dataset.reviewEdit)].step);
      });
    }

    function refreshSections() {
      sections.forEach(section => {
        const required = requiredElements(section);
        const complete = required.length ? required.every(fieldComplete) : true;
        const partial = !complete && hasAnyValue(section);
        section.classList.toggle('kf-section-complete', complete);
        section.classList.toggle('kf-section-partial', partial);
        if (complete) section.classList.remove('kf-section-problem');
        const status = section.querySelector('.kfSectionStatus');
        if (status) status.textContent = complete ? '✓ ครบแล้ว' : partial ? 'กำลังกรอก' : 'ยังไม่ครบ';
      });
      stepButtons.forEach((button, index) => {
        const complete = stepComplete(index);
        button.classList.toggle('complete', complete && index !== activeStep);
        button.querySelector('.kfWizardDot').textContent = complete && index !== activeStep ? '✓' : String(index + 1);
      });
      if (activeStep === 3) buildReview();
    }

    function showStep(index, shouldScroll) {
      activeStep = Math.max(0, Math.min(STEP_MAP.length - 1, index));
      sections.forEach(section => section.classList.add('kfWizardHidden'));
      review.classList.add('kfWizardHidden');
      stepSections(activeStep).forEach(section => section.classList.remove('kfWizardHidden'));
      if (activeStep === 3) {
        review.classList.remove('kfWizardHidden');
        buildReview();
      }
      stepButtons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === activeStep));
      backButton.style.visibility = activeStep === 0 ? 'hidden' : 'visible';
      nextButton.style.display = activeStep === STEP_MAP.length - 1 ? 'none' : '';
      submitButton.style.display = activeStep === STEP_MAP.length - 1 ? '' : 'none';
      setError('');
      refreshSections();
      if (shouldScroll !== false) window.scrollTo({ top: Math.max(0, wizard.getBoundingClientRect().top + window.scrollY - 8), behavior: 'smooth' });
    }

    backButton.onclick = () => showStep(activeStep - 1);
    nextButton.onclick = () => { if (validateStep(activeStep)) showStep(activeStep + 1); };
    stepButtons.forEach(button => {
      button.onclick = () => {
        const target = Number(button.dataset.step);
        if (target <= activeStep) showStep(target);
        else if (target === activeStep + 1 && validateStep(activeStep)) showStep(target);
      };
    });
    form.addEventListener('input', event => {
      event.target.classList.remove('kfFieldError');
      refreshSections();
    });
    form.addEventListener('change', event => {
      event.target.classList.remove('kfFieldError');
      refreshSections();
    });
    showStep(0, false);
  }

  function initRegistration() {
    const main = document.querySelector('main.wrap');
    const form = document.getElementById('form');
    const submitButton = document.getElementById('submitBtn');
    if (!main || !form || !submitButton) return;
    document.body.classList.add('kfEmployeeRegistration');
    installHero(main);
    const sections = Array.from(form.querySelectorAll(':scope > section.card'));
    if (sections.length < 9) return;
    decorateSections(sections);
    installWizard(form, sections, submitButton);
  }

  ready(initRegistration);
})();
