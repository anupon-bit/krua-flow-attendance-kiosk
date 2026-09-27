(() => {
  'use strict';

  const EXTRA_REQUIRED_IDS = new Set(['docIdCard', 'docHouse', 'photo']);
  const STEP_MAP = [
    { key: 'personal', label: 'ข้อมูลส่วนตัว', sectionIndexes: [1, 2, 3, 4, 5] },
    { key: 'work', label: 'ข้อมูลการทำงาน', sectionIndexes: [0] },
    { key: 'documents', label: 'เอกสารสำคัญ', sectionIndexes: [6, 7] },
    { key: 'review', label: 'ตรวจสอบและส่ง', sectionIndexes: [8] }
  ];

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function cleanRegistrationUrl() {
    const url = new URL(location.href);
    ['embed', 'admin', 'v', 'preview'].forEach(key => url.searchParams.delete(key));
    url.hash = '';
    return url.href;
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
    document.execCommand('copy');
    area.remove();
  }

  function installSharePanel(anchor) {
    const params = new URLSearchParams(location.search);
    const isAdminView = params.get('embed') === '1' || params.get('admin') === '1';
    if (!isAdminView) return;

    const url = cleanRegistrationUrl();
    const panel = document.createElement('section');
    panel.className = 'kfSharePanel show';
    panel.setAttribute('aria-label', 'ส่งลิงก์แบบลงทะเบียนให้พนักงาน');
    panel.innerHTML = [
      '<div class="kfShareTitle">ส่งแบบฟอร์มให้พนักงาน</div>',
      '<div class="kfShareSub">ให้พนักงานเปิดจากโทรศัพท์ แล้วกรอกข้อมูลและแนบเอกสารด้วยตนเอง</div>',
      '<div class="kfShareUrl"><span>' + escapeHtml(url) + '</span></div>',
      '<div class="kfShareActions">',
      '<button class="kfShareBtn" type="button">ส่งลิงก์ให้พนักงาน</button>',
      '<button class="kfLineBtn" type="button">ส่งผ่าน LINE</button>',
      '<button class="kfCopyBtn" type="button">คัดลอกลิงก์</button>',
      '</div>',
      '<div class="kfShareFeedback" role="status" aria-live="polite"></div>'
    ].join('');

    const shareBtn = panel.querySelector('.kfShareBtn');
    const lineBtn = panel.querySelector('.kfLineBtn');
    const copyBtn = panel.querySelector('.kfCopyBtn');
    const feedback = panel.querySelector('.kfShareFeedback');
    const lineText = 'กรุณาเปิดลิงก์นี้เพื่อกรอกข้อมูลลงทะเบียนพนักงาน KruaFlow\n' + url;

    async function share() {
      feedback.textContent = '';
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'แบบลงทะเบียนพนักงาน KruaFlow',
            text: 'กรุณาเปิดลิงก์นี้เพื่อกรอกข้อมูลลงทะเบียนพนักงาน',
            url
          });
          feedback.textContent = 'เปิดเมนูส่งลิงก์แล้ว';
        } else {
          await copyText(url);
          feedback.textContent = 'คัดลอกลิงก์แล้ว สามารถนำไปส่งต่อได้ทันที';
        }
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        try {
          await copyText(url);
          feedback.textContent = 'คัดลอกลิงก์แล้ว สามารถนำไปส่งต่อได้ทันที';
        } catch (_) {
          feedback.textContent = 'คัดลอกไม่สำเร็จ กรุณาลองใหม่';
        }
      }
    }

    shareBtn.addEventListener('click', share);
    lineBtn.addEventListener('click', () => {
      window.open('https://line.me/R/msg/text/?' + encodeURIComponent(lineText), '_blank', 'noopener');
    });
    copyBtn.addEventListener('click', async () => {
      feedback.textContent = '';
      try {
        await copyText(url);
        feedback.textContent = 'คัดลอกลิงก์แล้ว';
      } catch (_) {
        feedback.textContent = 'คัดลอกไม่สำเร็จ กรุณาลองใหม่';
      }
    });

    anchor.insertAdjacentElement('afterend', panel);
  }

  function installRequiredHint(form) {
    const hint = document.createElement('div');
    hint.className = 'kfRequiredHint';
    hint.textContent = '* ช่องที่มีเครื่องหมายดอกจันจำเป็นต้องกรอกหรือแนบเอกสารให้ครบ';
    form.insertAdjacentElement('beforebegin', hint);
  }

  function enhanceFileInput(input) {
    if (!input || input.dataset.kfEnhanced === '1') return;
    input.dataset.kfEnhanced = '1';

    const picker = document.createElement('div');
    picker.className = 'kfFilePicker';
    input.parentNode.insertBefore(picker, input);
    picker.appendChild(input);
    input.classList.add('kfNativeFile');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kfFileButton';
    button.textContent = 'เลือกไฟล์';

    const name = document.createElement('div');
    name.className = 'kfFileName';
    name.textContent = 'ยังไม่ได้เลือกไฟล์';

    picker.append(button, name);
    button.addEventListener('click', () => input.click());

    const refresh = () => {
      const files = Array.from(input.files || []);
      picker.classList.toggle('has-file', files.length > 0);
      if (!files.length) name.textContent = 'ยังไม่ได้เลือกไฟล์';
      else if (files.length === 1) name.textContent = files[0].name;
      else name.textContent = 'เลือกแล้ว ' + files.length + ' ไฟล์';
    };
    input.addEventListener('change', refresh);
    refresh();
  }

  function fieldHasValue(el) {
    if (!el || el.disabled) return true;
    if (el.type === 'checkbox' || el.type === 'radio') return !!el.checked;
    if (el.type === 'file') return !!(el.files && el.files.length);
    return String(el.value || '').trim() !== '';
  }

  function fieldComplete(el) {
    if (!fieldHasValue(el)) return false;
    if (typeof el.checkValidity === 'function' && !el.checkValidity()) return false;
    return true;
  }

  function requiredElements(section) {
    return Array.from(section.querySelectorAll('input,select,textarea')).filter(el =>
      el.required || EXTRA_REQUIRED_IDS.has(el.id)
    );
  }

  function hasAnyUserValue(section) {
    return Array.from(section.querySelectorAll('input,select,textarea')).some(el => {
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
      if (el.type === 'file') return !!(el.files && el.files.length);
      return String(el.value || '').trim() !== '';
    });
  }

  function decorateSection(section, index) {
    section.dataset.kfSection = String(index + 1);

    ['docIdCard', 'docHouse'].forEach(id => {
      const input = section.querySelector('#' + id);
      if (input) {
        input.required = true;
        const field = input.closest('.field');
        const label = field && field.querySelector('label');
        if (label) label.classList.add('req');
      }
    });
    const photo = section.querySelector('#photo');
    if (photo) photo.required = true;

    let heading = section.querySelector(':scope > h2');
    if (!heading) heading = section.querySelector(':scope > .docHead > h2');
    if (!heading && section.querySelector('#consent')) {
      heading = document.createElement('h2');
      heading.textContent = 'ยืนยันข้อมูล';
      section.insertBefore(heading, section.firstChild);
    }
    if (!heading) return;

    const parent = heading.parentElement;
    if (parent && parent.classList.contains('docHead')) {
      parent.classList.remove('docHead');
      parent.classList.add('kfSectionHeader');
    } else {
      const row = document.createElement('div');
      row.className = 'kfSectionHeader';
      heading.parentNode.insertBefore(row, heading);
      row.appendChild(heading);
    }

    const header = heading.parentElement;
    if (!header.querySelector('.kfSectionNumber')) {
      const number = document.createElement('span');
      number.className = 'kfSectionNumber';
      number.textContent = String(index + 1);
      header.insertBefore(number, heading);
    }

    if (!header.querySelector('.kfSectionStatus')) {
      const badge = document.createElement('span');
      badge.className = 'kfSectionStatus';
      badge.textContent = 'ยังไม่ครบ';
      header.appendChild(badge);
    }

    if (section.querySelector('#photo')) heading.classList.add('req');
  }

  function installEmployeeHero(main) {
    const hero = document.createElement('div');
    hero.className = 'kfEmployeeHero';
    hero.innerHTML = [
      '<div>',
      '<div class="kfEmployeeHeroBrand">KruaFlow <span>ระบบบุคลากร</span></div>',
      '<h1>ลงทะเบียนพนักงานใหม่</h1>',
      '<p>กรอกข้อมูลและแนบเอกสารให้ครบ เพื่อเริ่มใช้งานระบบ</p>',
      '</div>',
      '<div class="kfMobileBadge">ใช้ผ่านมือถือได้</div>'
    ].join('');
    const brand = main.querySelector('.brand');
    const sub = main.querySelector('.sub');
    if (brand) brand.style.display = 'none';
    if (sub) sub.style.display = 'none';
    main.insertBefore(hero, main.firstChild);
  }

  function installWizard(form, sections, submitButton) {
    let activeStep = 0;
    const wizard = document.createElement('div');
    wizard.className = 'kfWizard';
    wizard.innerHTML = STEP_MAP.map((step, i) =>
      '<button type="button" class="kfWizardStep" data-step="' + i + '">' +
      '<span class="kfWizardDot">' + (i + 1) + '</span>' +
      '<span class="kfWizardLabel">' + step.label + '</span>' +
      '</button>'
    ).join('');
    form.insertAdjacentElement('beforebegin', wizard);

    const review = document.createElement('section');
    review.className = 'card kfReviewCard';
    review.innerHTML = '<div class="kfReviewTitle">ตรวจสอบข้อมูลก่อนส่ง</div><div class="kfReviewList"></div>';
    sections[8].insertAdjacentElement('beforebegin', review);

    const controls = document.createElement('div');
    controls.className = 'kfWizardControls';
    controls.innerHTML = '<button type="button" class="kfBackBtn">ย้อนกลับ</button><button type="button" class="kfNextBtn">ถัดไป</button>';
    submitButton.parentNode.insertBefore(controls, submitButton);

    const backBtn = controls.querySelector('.kfBackBtn');
    const nextBtn = controls.querySelector('.kfNextBtn');
    const wizardButtons = Array.from(wizard.querySelectorAll('.kfWizardStep'));

    function getStepSections(stepIndex) {
      return STEP_MAP[stepIndex].sectionIndexes.map(i => sections[i]).filter(Boolean);
    }

    function stepRequiredElements(stepIndex) {
      return getStepSections(stepIndex).flatMap(section => requiredElements(section));
    }

    function firstInvalid(stepIndex) {
      return stepRequiredElements(stepIndex).find(el => !fieldComplete(el)) || null;
    }

    function validateStep(stepIndex) {
      const invalid = firstInvalid(stepIndex);
      if (!invalid) return true;
      invalid.classList.add('kfFieldError');
      const section = invalid.closest('.card');
      if (section) section.classList.add('kf-section-problem');
      invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => invalid.focus({ preventScroll: true }), 300);
      const error = document.getElementById('error');
      if (error) {
        error.textContent = 'กรุณากรอกหรือแนบข้อมูลที่จำเป็นให้ครบก่อนกดถัดไป';
        error.classList.add('show');
      }
      return false;
    }

    function selectedLabel(id) {
      const el = document.getElementById(id);
      if (!el) return '-';
      if (el.tagName === 'SELECT') {
        const option = el.options[el.selectedIndex];
        return option && option.value ? option.text : '-';
      }
      return String(el.value || '').trim() || '-';
    }

    function buildReview() {
      const docs = ['docIdCard', 'docHouse', 'photo'].map(id => {
        const el = document.getElementById(id);
        return !!(el && el.files && el.files.length);
      });
      const list = review.querySelector('.kfReviewList');
      list.innerHTML = [
        '<div class="kfReviewRow"><strong>ข้อมูลส่วนตัว</strong><span>' +
          escapeHtml(selectedLabel('firstName') + ' ' + selectedLabel('lastName')) +
          '<br>' + escapeHtml(selectedLabel('phone')) +
          '</span><button type="button" data-edit="0">แก้ไข</button></div>',
        '<div class="kfReviewRow"><strong>ข้อมูลการทำงาน</strong><span>' +
          escapeHtml(selectedLabel('branch') + ' / ' + selectedLabel('department')) +
          '<br>' + escapeHtml(selectedLabel('position')) +
          '</span><button type="button" data-edit="1">แก้ไข</button></div>',
        '<div class="kfReviewRow"><strong>เอกสารสำคัญ</strong><span>' +
          (docs.every(Boolean) ? 'แนบเอกสารบังคับครบแล้ว ✓' : 'ยังแนบเอกสารไม่ครบ') +
          '</span><button type="button" data-edit="2">แก้ไข</button></div>'
      ].join('');
      list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.edit))));
    }

    function showStep(stepIndex) {
      activeStep = Math.max(0, Math.min(STEP_MAP.length - 1, stepIndex));
      sections.forEach(section => section.classList.add('kfWizardHidden'));
      review.classList.add('kfWizardHidden');

      getStepSections(activeStep).forEach(section => section.classList.remove('kfWizardHidden'));
      if (activeStep === 3) {
        review.classList.remove('kfWizardHidden');
        buildReview();
      }

      wizardButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === activeStep);
        const complete = i < activeStep && !firstInvalid(i);
        btn.classList.toggle('complete', complete);
        btn.querySelector('.kfWizardDot').textContent = complete ? '✓' : String(i + 1);
      });

      backBtn.style.visibility = activeStep === 0 ? 'hidden' : 'visible';
      nextBtn.style.display = activeStep === STEP_MAP.length - 1 ? 'none' : '';
      submitButton.style.display = activeStep === STEP_MAP.length - 1 ? '' : 'none';

      const error = document.getElementById('error');
      if (error && activeStep !== STEP_MAP.length - 1) {
        error.textContent = '';
        error.classList.remove('show');
      }

      const top = wizard.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    backBtn.addEventListener('click', () => showStep(activeStep - 1));
    nextBtn.addEventListener('click', () => {
      if (!validateStep(activeStep)) return;
      showStep(activeStep + 1);
    });
    wizardButtons.forEach(btn => btn.addEventListener('click', () => {
      const target = Number(btn.dataset.step);
      if (target <= activeStep || validateStep(activeStep)) showStep(target);
    }));

    showStep(0);
  }

  function installSectionProgress(form, sections, showBar) {
    let progress = null;
    if (showBar) {
      progress = document.createElement('div');
      progress.className = 'kfProgress';
      progress.innerHTML = [
        '<div class="kfProgressTop">',
        '<div class="kfProgressTitle">ความคืบหน้าการกรอกข้อมูล</div>',
        '<div class="kfProgressCount">0 / 0 ส่วน</div>',
        '</div>',
        '<div class="kfProgressTrack" aria-hidden="true"><div class="kfProgressBar"></div></div>'
      ].join('');
      form.insertAdjacentElement('beforebegin', progress);
    }

    function refresh() {
      let completed = 0;
      sections.forEach(section => {
        const required = requiredElements(section);
        const allDone = required.length ? required.every(fieldComplete) : true;
        const partial = !allDone && hasAnyUserValue(section);
        section.classList.toggle('kf-section-complete', allDone);
        section.classList.toggle('kf-section-partial', partial);
        section.classList.remove('kf-section-problem');
        const badge = section.querySelector('.kfSectionStatus');
        if (badge) badge.textContent = allDone ? 'กรอกครบแล้ว ✓' : (partial ? 'กำลังกรอก' : 'ยังไม่ครบ');
        if (allDone) completed += 1;
      });
      if (progress) {
        progress.querySelector('.kfProgressCount').textContent = completed + ' / ' + sections.length + ' ส่วน';
        progress.querySelector('.kfProgressBar').style.width = (sections.length ? Math.round(completed * 100 / sections.length) : 0) + '%';
      }
    }

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    form.addEventListener('reset', () => setTimeout(refresh, 0));
    refresh();
  }

  function init() {
    const main = document.querySelector('main.wrap');
    const form = document.getElementById('form');
    const submitButton = document.getElementById('submitBtn');
    if (!main || !form || !submitButton) return;

    const params = new URLSearchParams(location.search);
    const isAdminView = params.get('embed') === '1' || params.get('admin') === '1';
    document.body.classList.toggle('kfAdminRegistration', isAdminView);
    document.body.classList.toggle('kfEmployeeRegistration', !isAdminView);

    if (!isAdminView) installEmployeeHero(main);

    const sub = main.querySelector('.sub');
    if (sub) installSharePanel(sub);

    installRequiredHint(form);

    const sections = Array.from(form.querySelectorAll(':scope > section.card'));
    sections.forEach(decorateSection);
    document.querySelectorAll('input[type="file"]').forEach(enhanceFileInput);
    installSectionProgress(form, sections, isAdminView);

    if (!isAdminView) installWizard(form, sections, submitButton);
  }

  ready(init);
})();