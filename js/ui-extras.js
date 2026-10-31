/* ============================================================
 * 星际求知号 - 金币出口：机器伙伴衣柜 + 神秘星盒
 * 衣柜：先挑伙伴（v36 多物种），再配三类装扮（头饰/脸部/围绕）
 * 装扮全物种通用；普通款金币购买，金色款星盒掉落
 * 星盒：每天限开 2 个，概率掉装扮（稀有优先）或金币
 * ============================================================ */

const Extras = {
  /* ---------- 衣柜 ---------- */
  openWardrobe() {
    const o = Store.state.pet.outfits || { owned: [], worn: {} };
    const kinds = Store.state.pet.kinds || ['bot'];
    const activeKind = Store.state.pet.kind || 'bot';
    showModal({
      title: '🛰️ 伙伴衣柜',
      build(el, close) {
        /* ---- 伙伴挑选：已招募的随时免费切换，没招募的花金币领回家 ----
         * v38：每只伙伴各自记成长进度（新招募从蛋壳期养起），装扮全队通用 */
        el.appendChild(h('div', { class: 'wf-cat' }, '🛰️ 挑伙伴（每只伙伴有自己的成长进度 · 装扮全队通用）'));
        const kgrid = h('div', { class: 'wf-grid' });
        PET_KINDS.forEach(k => {
          const owned = kinds.includes(k.id);
          const active = activeKind === k.id;
          const kStage = Store.petStageOf(k.id);
          const wfe = h('div', { class: 'wfe wfe-pet' });
          wfe.innerHTML = robotSVG(kStage, k.id);
          const tile = h('button', {
            class: 'wf-item' + (owned ? ' owned' : '') + (active ? ' worn' : ''),
            onclick: e => {
              Sound.tap();
              if (active) { toast('它已经陪在你身边啦'); return; }
              if (owned) {
                Store.setPetKind(k.id);
                Sound.correct();
                toast(`${k.emoji} ${k.name} 上场！${kStage === 0 ? '它还是小不点，喂能量块帮它长大吧' : ''}`);
                renderHome();
                Extras.openWardrobe();
                return;
              }
              const r = Store.buyPetKind(k.id);
              if (r.ok) {
                Sound.gold();
                const c = centerOf(e.currentTarget);
                burst(c.x, c.y, { count: 16, emojis: [k.emoji, '✨', '⭐'], power: 90 });
                updateTop();
                renderHome();
                toast(`🐣 ${k.name} 报到！从「${k.stages[0].name}」开始养大它吧`);
                Extras.openWardrobe();
              } else toast(r.msg);
            }
          },
            wfe,
            h('div', { class: 'wfn' }, `${k.emoji} ${k.name}`),
            active ? h('div', { class: 'wfp' }, `当前伙伴 · ${k.stages[Math.min(kStage, k.stages.length - 1)].name}`)
              : owned ? h('div', { class: 'wfp' }, `点它上场 · ${k.stages[Math.min(kStage, k.stages.length - 1)].name}`)
                : h('div', { class: 'wfp' }, `${k.price} 🪙 招募 · 从蛋壳养起`)
          );
          kgrid.appendChild(tile);
        });
        el.appendChild(kgrid);

        const cats = [['head', '🎩 头饰'], ['face', '🕶️ 脸部'], ['neck', '🧣 围绕']];
        el.appendChild(h('div', { class: 'tiny', style: 'margin:4px 0 2px' },
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
                  : item.hween ? h('div', { class: 'wfp hween-tag' }, Store.isHalloween && Store.isHalloween() ? '🎃 万圣节限定 · 南瓜星盒掉落' : '🎃 万圣节限定 · 已绝版')
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

  /* ---------- 神秘星盒（万圣节期间变「南瓜星盒」：掉率翻倍 + 限定款） ---------- */
  openBox() {
    const s = Store.state;
    const hw = Store.isHalloween && Store.isHalloween();
    const boxEmoji = hw ? '🎃' : '🎁';
    const boxName = hw ? '🎃 南瓜星盒' : '🎁 神秘星盒';
    const boxHint = hw ? '可能掉落装扮、万圣节限定款或金币 · 装扮掉率翻倍！' : '可能掉落装扮、稀有装扮或金币';
    const left = Math.max(0, 2 - (s.today.boxOpened || 0));
    showModal({
      title: boxName,
      build(el, close) {
        const stage = h('div', { class: 'box-stage' }, boxEmoji);
        const info = h('div', { class: 'tiny center' },
          `单价 ${STAR_BOX_COST} 🪙 · 今天还能开 ${left} 个 · ${boxHint}`);
        const bar = h('div', { class: 'modal-actions' });

        const renderIdle = () => {
          stage.className = 'box-stage';
          stage.textContent = boxEmoji;
          info.textContent = `单价 ${STAR_BOX_COST} 🪙 · 今天还能开 ${Math.max(0, 2 - (Store.state.today.boxOpened || 0))} 个 · ${boxHint}`;
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
              stage.textContent = boxEmoji;
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
                  if (r.drop.item.hween) toast('🎃 万圣节限定 · ' + r.drop.item.name + '！过期可就绝版啦');
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
          }, `打开${hw ? '南瓜星盒' : '星盒'}（-${STAR_BOX_COST} 🪙）`));
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
