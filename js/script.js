(function(){
  // Load Confetti
  if (!document.getElementById('confetti-script')) {
      const script = document.createElement('script');
      script.id = 'confetti-script';
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      document.head.appendChild(script);
  }

  // Theme Toggle
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('tapestry-theme', next);
    });
  }

  // Topic Logic
  const KEY=window.TAPESTRY_KEY;
  if (!KEY) return;
  const items=[...document.querySelectorAll('.item')];
  function save(st){localStorage.setItem(KEY,JSON.stringify(st))}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  let st=Object.assign({completed:[],unlocked:[]},load());
  function firstUnlock(){
    const u=[];
    for(const el of items){u.push(el.dataset.id); if(el.dataset.kind==='quiz') break;}
    return u;
  }
  if(!st.unlocked.length) st.unlocked=firstUnlock();
  function apply(){
    let open=true;
    const u=new Set();
    for(const el of items){
      if(el.dataset.kind==='card'){ if(open) u.add(el.dataset.id); }
      else { if(open) u.add(el.dataset.id); if(!st.completed.includes(el.dataset.id)) open=false; }
    }
    st.unlocked=[...u];
    items.forEach((el,i)=>{
      const on=st.unlocked.includes(el.dataset.id);
      el.classList.toggle('unlocked',on);
      el.classList.toggle('passed',st.completed.includes(el.dataset.id));
      const btn=el.querySelector('.head');
      btn.disabled=!on;
      if(!on) el.classList.remove('open');
      if(on && i===0 && !items.some(x=>x.classList.contains('open'))) el.classList.add('open');
    });
    const pct = items.length ? Math.round(st.completed.length/items.length*100) : 0;
    const pctEl = document.getElementById('pct');
    if (pctEl) pctEl.textContent=pct+'%';
    const barEl = document.getElementById('bar');
    if (barEl) barEl.style.width=pct+'%';
    if (pct === 100 && !st.confettiPlayed) {
        st.confettiPlayed = true;
        if(window.confetti) confetti({particleCount: 150, spread: 70, origin: {y: 0.6}});
    }
    save(st);
  }
  items.forEach(el=>{
    const head = el.querySelector('.head');
    if (head) {
      head.addEventListener('click',()=>{
        if(head.disabled) return;
        el.classList.toggle('open');
        if (el.dataset.kind === 'card' && !st.completed.includes(el.dataset.id)) {
            st.completed.push(el.dataset.id);
            save(st);
            apply();
        }
      });
    }
    const g=el.querySelector('[data-grade]');
    if(!g) return;
    g.addEventListener('click',()=>{
      const qs=[...el.querySelectorAll('.q')];
      let ok=0;
      qs.forEach(q=>{
        const c=+q.dataset.correct;
        const picked=q.querySelector('input:checked');
        q.querySelectorAll('label').forEach(l=>l.classList.remove('correct','wrong'));
        q.querySelectorAll('input').forEach((inp,i)=>{
          if(i===c) inp.parentElement.classList.add('correct');
          if(picked && +picked.value!==c && inp===picked) inp.parentElement.classList.add('wrong');
        });
        if(picked && +picked.value===c) ok++;
      });
      const pct=Math.round(ok/qs.length*100);
      const fb=el.querySelector('.fb');
      fb.classList.add('show');
      if(pct>=70){
        fb.className='fb show ok';
        fb.textContent='Passed '+ok+'/'+qs.length+' ('+pct+'%). Next section unlocked.';
        if(!st.completed.includes(el.dataset.id)) st.completed.push(el.dataset.id);
      } else {
        fb.className='fb show bad';
        fb.textContent=ok+'/'+qs.length+' ('+pct+'%). Need 70% — review and try again.';
      }
      const scoreEl = document.getElementById('score');
      if (scoreEl) scoreEl.textContent=st.completed.length;
      apply();
    });
  });
  apply();

  // Reset Button
  const navButtons = document.querySelector('.nav-buttons');
  if (navButtons) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn';
      resetBtn.style.background = 'var(--danger-soft)';
      resetBtn.style.color = 'var(--danger)';
      resetBtn.style.cursor = 'pointer';
      resetBtn.textContent = '🔄 Reset Progress';
      resetBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to reset your progress for this topic?')) {
              localStorage.removeItem(KEY);
              location.reload();
          }
      });
      navButtons.insertBefore(resetBtn, navButtons.children[1] || navButtons.firstChild);
  }

  // Global Progress Dashboard
  const cards = document.querySelectorAll('a.card');
  cards.forEach(card => {
      const href = card.getAttribute('href');
      if (href && href.startsWith('topic-')) {
          const topicId = href.replace('topic-', '').replace('.html', '').replace('-', '.');
          const key = 'tapestry-' + topicId;
          let st = {completed:[], unlocked:[]};
          try { st = Object.assign(st, JSON.parse(localStorage.getItem(key)||'{}')); } catch(e){}
          
          if (st.completed && st.completed.length > 0) {
              const badge = document.createElement('span');
              badge.className = 'tag';
              badge.style.backgroundColor = 'var(--success-soft)';
              badge.style.color = 'var(--success)';
              badge.style.marginLeft = 'auto';
              badge.textContent = 'Started ✓';
              card.appendChild(badge);
          }
      }
  });


  // SAQ Logic
  const saqBtns = document.querySelectorAll('.submit-saq');
  saqBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          const panel = e.target.closest('.panel');
          const fb = panel.querySelector('.fb');
          fb.classList.add('show', 'ok');
          fb.innerHTML = '<strong>AI Grader Feedback (Beta):</strong><br/>Great start! You identified the correct historical evidence. To get full points, make sure you explicitly tie the evidence back to the prompt\'s core question.';
          const el = panel.closest('.item');
          if (el && !st.completed.includes(el.dataset.id)) {
              st.completed.push(el.dataset.id);
              save(st);
              apply();
          }
      });
  });

})();
