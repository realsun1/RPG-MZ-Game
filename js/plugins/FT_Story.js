//=============================================================================
// FT_Story.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.0 Glowing markers on every door, entrance and exit, story actors on events, and an objective banner.
 * @author FT Tilesets
 *
 * @param markerColor
 * @text Marker colour
 * @desc Colour of the exit arrows and floor glow (CSS colour).
 * @type string
 * @default #ffd36e
 *
 * @param floorGlow
 * @text Floor glow
 * @desc Softly lit tiles under every exit.
 * @type boolean
 * @default true
 *
 * @param showLabels
 * @text Destination labels
 * @desc Show where an exit leads when the player is close to it.
 * @type boolean
 * @default true
 *
 * @param labelDistance
 * @text Label distance
 * @desc Tiles from an exit at which its label appears.
 * @type number
 * @min 1
 * @default 3
 *
 * @param fadeDistance
 * @text Fade distance
 * @desc Tiles from an exit at which its marker is faintest.
 * @type number
 * @min 2
 * @default 10
 *
 * @param minOpacity
 * @text Far opacity
 * @desc Opacity (0-255) of markers far from the player.
 * @type number
 * @min 0
 * @max 255
 * @default 110
 *
 * @param hideInEvents
 * @text Hide during scenes
 * @desc Hide markers and the objective while an event is running or a message is open.
 * @type boolean
 * @default true
 *
 * @param objectiveY
 * @text Objective banner Y
 * @desc Distance of the objective banner from the top of the screen.
 * @type number
 * @default 12
 *
 * @command objective
 * @text Set Objective
 * @desc Show a goal in the banner at the top of the map screen.
 *
 * @arg text
 * @text Text
 * @type string
 * @default
 *
 * @command clearObjective
 * @text Clear Objective
 * @desc Remove the objective banner.
 *
 * @command markers
 * @text Exit Markers On/Off
 * @desc Turn the exit markers on or off (saved with the game).
 *
 * @arg show
 * @text Show
 * @type boolean
 * @default true
 *
 * @help
 * FT_Story.js - put it below FT_MapLayers in the plugin list.
 *
 * EXIT MARKERS
 *   Every event that transfers the player (a Transfer Player command on its
 *   current page, triggered by Action Button, Player Touch or Event Touch)
 *   gets a marker, with nothing to set up:
 *     map edges        a glowing arrow pointing off the map
 *     doors, caves,    a bobbing arrow above the entrance
 *     entrances
 *   Neighbouring exits to the same map share one marker.  The tiles of every
 *   exit glow softly, and the destination's name appears when the player is
 *   near (the event's name after "To " / "Door to ", or the map's name).
 *   Exits that are switched off (another page without a transfer) lose their
 *   marker by themselves.
 *
 *   Event note tags:
 *     <FTNoMarker>            no marker for this event
 *     <FTMarker: door>        force the entrance arrow
 *     <FTMarker: edge>        force the edge arrow
 *     <FTLabel: Text>         label shown instead of the map name
 *
 * STORY ACTORS
 *   <FTActor: Name> in an event page's Comment (or the event's note) shows
 *   the database actor of that name (or nickname) with the actor's current
 *   character image - so story events always use the sprites your actors
 *   have.  Several names separated by | are tried in order, e.g.
 *   <FTActor: Mira|Mirajane>.  Without a matching actor the event stays
 *   invisible but still talks.
 *
 * OBJECTIVE
 *   Plugin Command "Set Objective" shows a goal in a small banner at the top
 *   of the map screen; it slides in when it changes and is saved with the
 *   game.  \N[n] (actor name) and \V[n] (variable) work in the text.
 *   Script: $gameSystem.setFtObjective("text")
 */

(() => {
    'use strict';
    const NAME = 'FT_Story';
    const P = PluginManager.parameters(NAME);
    const COLOR = String(P.markerColor || '#ffd36e');
    const FLOOR = String(P.floorGlow || 'true') === 'true';
    const LABELS = String(P.showLabels || 'true') === 'true';
    const LABEL_DIST = Number(P.labelDistance || 3);
    const FADE_DIST = Math.max(2, Number(P.fadeDistance || 10));
    const MIN_OPACITY = Number(P.minOpacity !== undefined && P.minOpacity !== '' ? P.minOpacity : 110);
    const HIDE_IN_EVENTS = String(P.hideInEvents || 'true') === 'true';
    const OBJ_Y = Number(P.objectiveY || 12);

    //-------------------------------------------------------------------------
    // helpers
    const tagOf = (text, key) => {
        const m = String(text || '').match(new RegExp('<' + key + '(?:\\s*:\\s*([^>]*))?>', 'i'));
        return m ? (m[1] !== undefined ? m[1].trim() : true) : null;
    };
    const pageComments = page => {
        if (!page || !page.list) return '';
        return page.list.filter(c => c.code === 108 || c.code === 408).map(c => c.parameters[0]).join('\n');
    };
    const transferOf = page => {
        if (!page || !page.list) return null;
        for (const c of page.list) {
            if (c.code === 201) return c.parameters;
        }
        return null;
    };
    const escape = text => String(text || '')
        .replace(/\\V\[(\d+)\]/gi, (_, n) => $gameVariables.value(Number(n)))
        .replace(/\\N\[(\d+)\]/gi, (_, n) => {
            const a = $gameActors.actor(Number(n));
            return a ? a.name() : '';
        });
    const rgba = (hex, a) => {
        const h = hex.replace('#', '');
        const v = h.length === 3 ? h.split('').map(c => parseInt(c + c, 16)) : [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
        return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
    };

    //-------------------------------------------------------------------------
    // Game_System: objective and marker switch (saved with the game)
    Game_System.prototype.ftObjective = function() {
        return this._ftObjective || '';
    };
    Game_System.prototype.setFtObjective = function(text) {
        this._ftObjective = String(text || '');
    };
    Game_System.prototype.ftMarkersOn = function() {
        return !this._ftMarkersOff;
    };

    PluginManager.registerCommand(NAME, 'objective', args => $gameSystem.setFtObjective(args.text));
    PluginManager.registerCommand(NAME, 'clearObjective', () => $gameSystem.setFtObjective(''));
    PluginManager.registerCommand(NAME, 'markers', args => {
        $gameSystem._ftMarkersOff = String(args.show) === 'false';
    });

    //-------------------------------------------------------------------------
    // Game_Map: a stamp that changes whenever events may have changed page
    const _Game_Map_refresh = Game_Map.prototype.refresh;
    Game_Map.prototype.refresh = function() {
        _Game_Map_refresh.call(this);
        this._ftStamp = (this._ftStamp || 0) + 1;
    };
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this._ftStamp = (this._ftStamp || 0) + 1;
    };
    Game_Map.prototype.ftStamp = function() {
        return this._ftStamp || 0;
    };

    //-------------------------------------------------------------------------
    // Game_Event: story actors and exit info
    const _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _Game_Event_setupPageSettings.call(this);
        const name = tagOf(pageComments(this.page()), 'FTActor') || tagOf(this.event().note, 'FTActor');
        if (name && name !== true) {
            const names = String(name).split('|').map(n => n.trim()).filter(n => n);
            let data = null;
            for (const n of names) {
                data = $dataActors.find(a => a && (a.name === n || a.nickname === n));
                if (data) break;
            }
            if (data) {
                const actor = $gameActors.actor(data.id);
                const img = actor ? actor.characterName() : data.characterName;
                const idx = actor ? actor.characterIndex() : data.characterIndex;
                if (img) this.setImage(img, idx);
            }
        }
    };

    Game_Event.prototype.ftExit = function() {
        if (this._erased) return null;
        const note = this.event().note;
        if (tagOf(note, 'FTNoMarker')) return null;
        const forced = tagOf(note, 'FTMarker');
        if (forced === 'none') return null;
        const page = this.page();
        if (!page) return null;
        const tr = transferOf(page);
        if (!tr && !forced) return null;
        if (!forced && page.trigger > 2) return null;
        const mapId = tr ? (tr[0] === 0 ? tr[1] : $gameVariables.value(tr[1])) : 0;
        let label = tagOf(note, 'FTLabel');
        if (!label || label === true) {
            const n = this.event().name || '';
            const m = n.match(/^(?:Door to|To)\s+(.+?)(?:\s+\(left\))?$/i);
            if (m) label = m[1];
            else if ($dataMapInfos[mapId]) label = $dataMapInfos[mapId].name;
            else label = '';
        }
        return { mapId, forced: forced === true ? null : forced, label };
    };

    //-------------------------------------------------------------------------
    // marker art (drawn once)
    const Art = {
        _cache: {},
        arrow() {
            if (this._cache.arrow) return this._cache.arrow;
            const b = new Bitmap(56, 56);
            const c = b.context;
            c.save();
            c.translate(28, 28);
            c.shadowColor = rgba(COLOR, 0.9);
            c.shadowBlur = 10;
            for (const [dx, a] of [[-9, 0.55], [5, 1.0]]) {
                c.beginPath();
                c.moveTo(dx - 6, -13);
                c.lineTo(dx + 7, 0);
                c.lineTo(dx - 6, 13);
                c.lineWidth = 7;
                c.lineCap = 'round';
                c.lineJoin = 'round';
                c.strokeStyle = 'rgba(40,24,10,0.55)';
                c.stroke();
                c.lineWidth = 5;
                c.strokeStyle = rgba(COLOR, a);
                c.stroke();
                c.lineWidth = 2;
                c.strokeStyle = `rgba(255,255,240,${a})`;
                c.stroke();
            }
            c.restore();
            b.baseTexture.update();
            return (this._cache.arrow = b);
        },
        door() {
            if (this._cache.door) return this._cache.door;
            const b = new Bitmap(44, 44);
            const c = b.context;
            c.save();
            c.translate(22, 20);
            c.shadowColor = rgba(COLOR, 0.95);
            c.shadowBlur = 12;
            const path = () => {
                c.beginPath();
                c.moveTo(-10, -9);
                c.quadraticCurveTo(0, -12, 10, -9);
                c.quadraticCurveTo(12, -7, 9.5, -4);
                c.lineTo(2.2, 9);
                c.quadraticCurveTo(0, 12, -2.2, 9);
                c.lineTo(-9.5, -4);
                c.quadraticCurveTo(-12, -7, -10, -9);
                c.closePath();
            };
            path();
            c.lineWidth = 3;
            c.strokeStyle = 'rgba(40,24,10,0.6)';
            c.stroke();
            const g = c.createLinearGradient(0, -12, 0, 12);
            g.addColorStop(0, '#fffbe8');
            g.addColorStop(0.45, COLOR);
            g.addColorStop(1, rgba(COLOR, 0.85));
            c.fillStyle = g;
            path();
            c.fill();
            c.shadowBlur = 0;
            c.beginPath();
            c.ellipse(-3, -6, 4, 1.6, -0.2, 0, Math.PI * 2);
            c.fillStyle = 'rgba(255,255,255,0.85)';
            c.fill();
            c.restore();
            b.baseTexture.update();
            return (this._cache.door = b);
        },
        glow() {
            if (this._cache.glow) return this._cache.glow;
            const b = new Bitmap(64, 48);
            const c = b.context;
            const g = c.createRadialGradient(32, 24, 2, 32, 24, 30);
            g.addColorStop(0, rgba(COLOR, 0.55));
            g.addColorStop(0.55, rgba(COLOR, 0.22));
            g.addColorStop(1, rgba(COLOR, 0));
            c.save();
            c.scale(1, 0.75);
            c.fillStyle = g;
            c.beginPath();
            c.arc(32, 32, 30, 0, Math.PI * 2);
            c.fill();
            c.restore();
            b.baseTexture.update();
            return (this._cache.glow = b);
        },
        label(text) {
            const probe = new Bitmap(1, 1);
            probe.fontFace = $gameSystem.mainFontFace();
            probe.fontSize = 17;
            const w = Math.ceil(probe.measureTextWidth(text)) + 28;
            probe.destroy();
            const b = new Bitmap(w, 30);
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 17;
            const c = b.context;
            c.save();
            c.beginPath();
            const r = 13;
            c.moveTo(r, 2);
            c.lineTo(w - r, 2);
            c.arc(w - r, 15, 13, -Math.PI / 2, Math.PI / 2);
            c.lineTo(r, 28);
            c.arc(r, 15, 13, Math.PI / 2, Math.PI * 1.5);
            c.closePath();
            c.fillStyle = 'rgba(24,18,34,0.62)';
            c.fill();
            c.lineWidth = 1.5;
            c.strokeStyle = rgba(COLOR, 0.8);
            c.stroke();
            c.restore();
            b.baseTexture.update();
            b.textColor = '#fff8e6';
            b.outlineColor = 'rgba(0,0,0,0.6)';
            b.outlineWidth = 3;
            b.drawText(text, 0, 1, w, 28, 'center');
            return b;
        }
    };

    //-------------------------------------------------------------------------
    // Spriteset_Map: the markers
    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this._ftLayer = new Sprite();
        this._baseSprite.addChild(this._ftLayer);
        this._ftGroups = [];
        this._ftStamp = -1;
        this._ftAlpha = 0;
    };

    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this);
        if (this._ftLayer) this.ftUpdateMarkers();
    };

    Spriteset_Map.prototype.ftClearMarkers = function() {
        for (const g of this._ftGroups) {
            for (const s of g.glows) this._tilemap.removeChild(s);
            this._ftLayer.removeChild(g.sprite);
            if (g.label) {
                this._ftLayer.removeChild(g.label);
                g.label.bitmap.destroy();
            }
        }
        this._ftGroups = [];
    };

    Spriteset_Map.prototype.ftBuildMarkers = function() {
        this.ftClearMarkers();
        const w = $gameMap.width();
        const h = $gameMap.height();
        const exits = [];
        for (const ev of $gameMap.events()) {
            const info = ev.ftExit();
            if (!info) continue;
            const x = ev.x;
            const y = ev.y;
            const onEdge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
            const kind = info.forced === 'door' || info.forced === 'edge' ? info.forced : (onEdge ? 'edge' : 'door');
            const dir = kind !== 'edge' ? 0 : x === 0 ? 4 : x === w - 1 ? 6 : y === 0 ? 8 : 2;
            exits.push({ ev, x, y, kind, dir, mapId: info.mapId, label: info.label });
        }
        const used = new Set();
        for (let i = 0; i < exits.length; i++) {
            if (used.has(i)) continue;
            const members = [exits[i]];
            used.add(i);
            for (let k = 0; k < members.length; k++) {
                for (let j = 0; j < exits.length; j++) {
                    if (used.has(j)) continue;
                    const a = members[k];
                    const b = exits[j];
                    if (a.mapId === b.mapId && a.kind === b.kind && a.dir === b.dir && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) {
                        members.push(b);
                        used.add(j);
                    }
                }
            }
            this._ftGroups.push(this.ftMakeGroup(members));
        }
    };

    Spriteset_Map.prototype.ftMakeGroup = function(members) {
        const first = members[0];
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length;
        const cy = members.reduce((s, m) => s + m.y, 0) / members.length;
        const sprite = new Sprite(first.kind === 'edge' ? Art.arrow() : Art.door());
        sprite.anchor.set(0.5, 0.5);
        sprite.rotation = { 6: 0, 2: Math.PI / 2, 4: Math.PI, 8: -Math.PI / 2 }[first.dir] || 0;
        sprite.blendMode = 0;
        this._ftLayer.addChild(sprite);
        const glows = [];
        if (FLOOR) {
            for (const m of members) {
                const g = new Sprite(Art.glow());
                g.anchor.set(0.5, 0.5);
                g.blendMode = 1;
                g.z = 1;
                g._ftX = m.x;
                g._ftY = m.y;
                this._tilemap.addChild(g);
                glows.push(g);
            }
        }
        let label = null;
        if (LABELS && first.label) {
            label = new Sprite(Art.label(first.label));
            label.anchor.set(0.5, 0.5);
            label.opacity = 0;
            this._ftLayer.addChild(label);
        }
        // entrances: the arrow floats above the door (2 tiles up for a door sprite, 1 otherwise)
        let lift = 0;
        if (first.kind === 'door') {
            const img = first.ev.characterName();
            lift = img && (/1x2|2x2|1x3/.test(img) || ImageManager.isBigCharacter(img)) ? 2.15 : (img ? 1.25 : 0.95);
        }
        return { members, cx, cy, kind: first.kind, dir: first.dir, sprite, glows, label, lift, phase: (cx * 7 + cy * 13) % 60 };
    };

    Spriteset_Map.prototype.ftUpdateMarkers = function() {
        if ($gameMap.ftStamp() !== this._ftStamp) {
            this._ftStamp = $gameMap.ftStamp();
            this.ftBuildMarkers();
        }
        const busy = HIDE_IN_EVENTS && ($gameMap.isEventRunning() || $gameMessage.isBusy());
        const show = $gameSystem.ftMarkersOn() && !busy && !$gamePlayer.isTransferring();
        this._ftAlpha += ((show ? 1 : 0) - this._ftAlpha) * 0.12;
        const tw = $gameMap.tileWidth();
        const th = $gameMap.tileHeight();
        const t = Graphics.frameCount;
        const px = $gamePlayer._realX;
        const py = $gamePlayer._realY;
        for (const g of this._ftGroups) {
            let near = 1e9;
            for (const m of g.members) near = Math.min(near, Math.hypot(m.x - px, m.y - py));
            const k = Math.max(0, Math.min(1, (near - 1.5) / (FADE_DIST - 1.5)));
            const op = (255 - (255 - MIN_OPACITY) * k) * this._ftAlpha;
            const sx = ($gameMap.adjustX(g.cx) + 0.5) * tw;
            const sy = ($gameMap.adjustY(g.cy) + 0.5) * th;
            const s = g.sprite;
            const wave = Math.sin((t + g.phase) * 0.075);
            if (g.kind === 'edge') {
                const push = 4 + wave * 4;
                const v = { 6: [1, 0], 4: [-1, 0], 2: [0, 1], 8: [0, -1] }[g.dir] || [0, 0];
                s.x = sx + v[0] * push;
                s.y = sy + v[1] * push - (g.dir === 2 ? 6 : 0);
                s.scale.set(0.82 + 0.06 * wave, 0.82 + 0.06 * wave);
            } else {
                s.x = sx;
                s.y = sy + th / 2 - g.lift * th - 4 + wave * 4;
                s.scale.set(0.9 + 0.05 * wave, 0.9 + 0.05 * wave);
            }
            s.opacity = op * (0.85 + 0.15 * wave);
            for (const gl of g.glows) {
                gl.x = ($gameMap.adjustX(gl._ftX) + 0.5) * tw;
                gl.y = ($gameMap.adjustY(gl._ftY) + 0.62) * th;
                gl.opacity = op * (0.55 + 0.25 * Math.sin((t + g.phase) * 0.05));
            }
            if (g.label) {
                const want = near <= LABEL_DIST && show ? 255 : 0;
                g.label.opacity += (want - g.label.opacity) * 0.15;
                if (g.kind === 'edge') {
                    const off = { 6: [-1.6, -0.9], 4: [1.6, -0.9], 2: [0, -1.4], 8: [0, 1.2] }[g.dir] || [0, -1];
                    g.label.x = sx + off[0] * tw * (g.dir === 4 || g.dir === 6 ? 1 + g.label.width / (tw * 3.2) : 1);
                    g.label.y = sy + off[1] * th;
                } else {
                    g.label.x = sx;
                    g.label.y = s.y - 30;
                }
                const half = g.label.width / 2;
                g.label.x = Math.max(half + 4, Math.min(Graphics.width - half - 4, g.label.x));
                g.label.y = Math.max(18, Math.min(Graphics.height - 18, g.label.y));
            }
        }
    };

    //-------------------------------------------------------------------------
    // the objective banner
    class Sprite_FtObjective extends Sprite {
        initialize() {
            super.initialize(new Bitmap(Math.min(Graphics.width - 24, 620), 44));
            this._text = null;
            this._slide = 0;
            this.x = 12;
            this.y = OBJ_Y;
            this.opacity = 0;
        }

        update() {
            super.update();
            const text = escape($gameSystem.ftObjective());
            if (text !== this._text) {
                this._text = text;
                this.redraw();
                this._slide = text ? 1 : 0;
            }
            const busy = HIDE_IN_EVENTS && ($gameMap.isEventRunning() || $gameMessage.isBusy());
            const want = this._text && !busy ? 255 : 0;
            this.opacity += Math.sign(want - this.opacity) * Math.min(14, Math.abs(want - this.opacity));
            this._slide *= 0.88;
            this.x = 12 - this._slide * 40;
        }

        redraw() {
            const b = this.bitmap;
            b.clear();
            if (!this._text) return;
            b.fontFace = $gameSystem.mainFontFace();
            b.fontSize = 18;
            const tw = Math.min(b.width - 12, Math.ceil(b.measureTextWidth(this._text)) + 58);
            const c = b.context;
            c.save();
            const g = c.createLinearGradient(0, 0, tw, 0);
            g.addColorStop(0, 'rgba(24,18,34,0.78)');
            g.addColorStop(1, 'rgba(24,18,34,0.5)');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(14, 4);
            c.lineTo(tw - 14, 4);
            c.quadraticCurveTo(tw, 4, tw, 18);
            c.lineTo(tw, 26);
            c.quadraticCurveTo(tw, 40, tw - 14, 40);
            c.lineTo(14, 40);
            c.quadraticCurveTo(0, 40, 0, 26);
            c.lineTo(0, 18);
            c.quadraticCurveTo(0, 4, 14, 4);
            c.fill();
            c.strokeStyle = rgba(COLOR, 0.75);
            c.lineWidth = 1.5;
            c.stroke();
            c.translate(24, 22);
            c.rotate(Math.PI / 4);
            c.fillStyle = COLOR;
            c.shadowColor = rgba(COLOR, 0.9);
            c.shadowBlur = 8;
            c.fillRect(-5, -5, 10, 10);
            c.restore();
            b.baseTexture.update();
            b.textColor = '#fff8e6';
            b.outlineColor = 'rgba(0,0,0,0.55)';
            b.outlineWidth = 3;
            b.drawText(this._text, 42, 7, tw - 50, 30, 'left');
        }
    }

    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        this._ftObjective = new Sprite_FtObjective();
        this.addChild(this._ftObjective);
    };
})();
