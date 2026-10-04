/* ============================================================
 * 星际求知号 - 金币出口：机器伙伴衣柜 + 神秘星盒
 * 衣柜：三类装扮（头饰/脸部/围绕），普通款金币购买，金色款星盒掉落
 * 星盒：每天限开 2 个，概率掉装扮（稀有优先）或金币
 * ============================================================ */

const Extras = {
  /* ---------- 衣柜 ---------- */
  openWardrobe() {
    const o = Store.state.pet.outfits || { owned: [], worn: {} };
    const cats = [['head', '🎩 头饰'], ['face', '🕶️ 脸部'], ['neck', '🧣 围绕']];
    showModal({
      title: '🎩 机器伙伴衣柜',
      build(el, close) {
        el.appendChild(h('div', { class: 'tiny', style: 'margin-bottom:6px' },
          `当前金币 ${Store.state.coins} 🪙 · 已收集 ${o.owned.length}/${PET_OUTFITS.length} 件 · 金色款只能从神秘星盒掉落`));
        cats.forEach(([cat, label]) => {
          el.appendChild(h('div', { class: 'wf-cat' }, label));
          const grid = h('div', { class: 'wf-grid' });
          PET_OUTFITS.filter(x => x.cat === cat).forEach(item => {
            const owned = o.owned.includes(item.id);
            const worn = o.worn[cat] === item.id;
            const tile = h('button', {
              class: 'wf-item' + (owned ? ' owned' : '') + (worn ? ' worn' : '') + (item.gold ? ' gold-item' : ''),
              onclick: e => {
                Sound.tap();
                if (worn) {
                  Store.wearOutfit(cat, null);
                  renderHome();
                  Extras.openWardrobe();
                  return;
                }
                if (owned) {
                  Store.wearOutfit(cat, item.id);
                  Sound.correct();
                  renderHome();
                  Extras.openWardrobe();
                  return;
                }
                if (item.gold) { toast('✨ 稀有款要从「神秘星盒」里掉落哦'); return; }
                const r = Store.buyOutfit(item.id);
                if (r.ok) {
                  Store.wearOutfit(cat, item.id);
                  Sound.gold();
                  const c = centerOf(e.currentTarget);
                  burst(c.x, c.y, { count: 14, emojis: ['✨', '🎩', '⭐'], power: 80 });
                  updateTop();
                  renderHome();
                  Extras.openWardrobe();
                } else toast(r.msg);
              }
            },
              h('div', { class: 'wfe' }, item.emoji),
              h('div', { class: 'wfn' }, item.name),
              worn ? h('div', { class: 'wfp' }, '穿上中 · 点脱下')
                : owned ? h('div', { class: 'wfp' }, '点穿上')
                  : item.gold ? h('div', { class: 'wfp' }, '🌟 稀有 · 星盒掉落')
                    : h('div', { class: 'wfp' }, `${item.price} 🪙`)
            );
            grid.appendChild(tile);
          });
          el.appendChild(grid);
        });
      },
      actions: [{ label: '好帅！', cls: 'btn-main' }]
    });
  },

  /* ---------- 神秘星盒 ---------- */
  openBox() {
    const s = Store.state;
    const left = Math.max(0, 2 - (s.today.boxOpened || 0));
    showModal({
      title: '🎁 神秘星盒',
      build(el, close) {
        const stage = h('div', { class: 'box-stage' }, '🎁');
        const info = h('div', { class: 'tiny center' },
          `单价 ${STAR_BOX_COST} 🪙 · 今天还能开 ${left} 个 · 可能掉落装扮、稀有装扮或金币`);
        const bar = h('div', { class: 'modal-actions' });

        const renderIdle = () => {
          stage.className = 'box-stage';
          stage.textContent = '🎁';
          info.textContent = `单价 ${STAR_BOX_COST} 🪙 · 今天还能开 ${Math.max(0, 2 - (Store.state.today.boxOpened || 0))} 个 · 可能掉落装扮、稀有装扮或金币`;
          bar.innerHTML = '';
          if (left <= 0 && (Store.state.today.boxOpened || 0) >= 2) {
            bar.appendChild(h('button', { class: 'btn btn-main', onclick: close }, '明天再来'));
            return;
          }
          bar.appendChild(h('button', {
            class: 'btn btn-main big',
            onclick: e => {
              const r = Store.openStarBox();
              if (!r.ok) { toast(r.msg); return; }
              Sound.tap();
              stage.className = 'box-stage shake';
              stage.textContent = '🎁';
              bar.innerHTML = '';
              setTimeout(() => {
                const c = centerOf(stage);
                Sound.gold();
                if (r.drop.kind === 'outfit') {
                  stage.className = 'box-stage';
                  stage.textContent = r.drop.item.emoji;
                  bar.innerHTML = '';
                  bar.appendChild(h('button', { class: 'btn btn-main big', onclick: () => { Extras.openWardrobe(); } }, '去衣柜穿上！'));
                  bar.appendChild(h('button', { class: 'btn', onclick: () => Extras.openBox() }, '再开一个'));
                  c && burst(c.x, c.y, { count: 24, emojis: ['✨', '🎉', r.drop.item.emoji], power: 120 });
                } else {
                  stage.className = 'box-stage';
                  stage.textContent = '🪙';
                  bar.innerHTML = '';
                  bar.appendChild(h('button', {
                    class: 'btn btn-main big',
                    onclick: () => { updateTop(); Extras.openBox(); }
                  }, `+${r.drop.n} 🪙！再开一个`));
                  c && burst(c.x, c.y, { count: 18, emojis: ['🪙', '⭐'], power: 100 });
                }
                updateTop();
              }, 900);
            }
          }, `打开星盒（-${STAR_BOX_COST} 🪙）`));
          bar.appendChild(h('button', { class: 'btn', onclick: close }, '先不开'));
        };
        renderIdle();

        el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:4px' },
          `当前金币 ${Store.state.coins} 🪙 · 已开过 ${s.stats.boxesOpened || 0} 个`));
        el.appendChild(stage);
        const drop = h('div', { class: 'box-drop' });
        el.appendChild(drop);
        el.appendChild(info);
        el.appendChild(bar);
      },
      actions: []
    });
  }
};
