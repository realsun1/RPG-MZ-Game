//=============================================================================
// FT_MapLayers.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.2 Map-anchored light layers (shadows, light, glow) above the map and reflection layers below the characters, with day/night sets.
 * @author FT Tilesets
 *
 * @param nightSwitch
 * @text Night Switch
 * @type switch
 * @default 0
 * @desc While this switch is ON, "night" layers show and "day" layers hide. 0 = always day.
 *
 * @param fadeFrames
 * @text Fade Frames
 * @type number
 * @min 0
 * @max 600
 * @default 60
 * @desc Frames used to cross-fade between day and night layers when the Night Switch changes.
 *
 * @param folder
 * @text Image Folder
 * @type string
 * @default img/parallaxes/
 * @desc Folder holding the layer images.
 *
 * @param dayOpacity
 * @text Day Strength
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc Global strength (%) of every "day" layer.
 *
 * @param nightOpacity
 * @text Night Strength
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @desc Global strength (%) of every "night" layer.
 *
 * @command setStrength
 * @text Set Strength
 * @desc Changes the global strength of day or night layers (fades over Fade Frames).
 *
 * @arg group
 * @text Group
 * @type select
 * @option day
 * @option night
 * @option always
 * @default day
 *
 * @arg strength
 * @text Strength (%)
 * @type number
 * @min 0
 * @max 100
 * @default 100
 *
 * @help
 * FT_MapLayers.js
 *
 * Draws map-sized images over the map, scrolling with it. By default a layer
 * lies above the ground, characters and upper tiles, below weather and
 * pictures. A layer marked "below" lies on the ground instead: above the lower
 * tiles but under every character and under the upper (star) tiles - used for
 * floor and water reflections. The map's screen tone applies to all layers.
 *
 * Map note tag (one line per layer, as many as you like):
 *   <FTLayer: file, blend, opacity, when, place>
 *     file     image name in the Image Folder (no extension)
 *     blend    normal | add | multiply | screen
 *     opacity  0-255 (optional, default 255)
 *     when     day | night | always (optional, default always)
 *     place    above | below (optional, default above)
 *
 * Exterior example (already in the FT sample maps):
 *   <FTLayer: FT_Magnolia_Reflect, normal, 255, always, below>
 *   <FTLayer: FT_Magnolia_Shadow, multiply, 255, day>
 *   <FTLayer: FT_Magnolia_Light, screen, 255, day>
 *   <FTLayer: FT_Magnolia_Glow, add, 255, day>
 *   <FTLayer: FT_Magnolia_NightShade, multiply, 255, night>
 *   <FTLayer: FT_Magnolia_NightGlow, add, 255, night>
 *
 * Interior example (every FT interior sample map has a day and a night set):
 *   <FTLayer: FT_GuildHall_Reflect, normal, 255, always, below>
 *   <FTLayer: FT_GuildHall_Shadow, multiply, 255, day>
 *   <FTLayer: FT_GuildHall_Light, screen, 255, day>
 *   <FTLayer: FT_GuildHall_Glow, add, 255, day>
 *   <FTLayer: FT_GuildHall_NightShade, multiply, 255, night>
 *   <FTLayer: FT_GuildHall_NightLight, screen, 255, night>
 *   <FTLayer: FT_GuildHall_NightGlow, add, 255, night>
 *
 * Layers are static images, nothing moves. Day layers keep the lit areas
 * bright and only darken the shade. Set the Night Switch parameter to the
 * switch you use for night; layers cross-fade when it changes. With Night
 * Switch = 0 only day/always layers are shown.
 *
 * Plugin command "Set Strength" scales a whole group (day, night, always),
 * e.g. 50% day strength on an overcast map.
 *
 * Deployment: every layer image of the FT sample maps is listed below as a
 * required asset, so "Exclude unused files" keeps them. Layer images for
 * your own maps are only referenced from map notes - keep them when deploying
 * (deploy without "Exclude unused files", or copy img/parallaxes yourself).
 *
 * Looping maps are not supported (the image is drawn once).
 *
 * @requiredAssets img/parallaxes/FT_MagLakeside_Reflect
 * @requiredAssets img/parallaxes/FT_MagLakeside_Shadow
 * @requiredAssets img/parallaxes/FT_MagLakeside_Light
 * @requiredAssets img/parallaxes/FT_MagLakeside_Glow
 * @requiredAssets img/parallaxes/FT_MagLakeside_NightShade
 * @requiredAssets img/parallaxes/FT_MagLakeside_NightGlow
 * @requiredAssets img/parallaxes/FT_MagCentral_Reflect
 * @requiredAssets img/parallaxes/FT_MagCentral_Shadow
 * @requiredAssets img/parallaxes/FT_MagCentral_Light
 * @requiredAssets img/parallaxes/FT_MagCentral_Glow
 * @requiredAssets img/parallaxes/FT_MagCentral_NightShade
 * @requiredAssets img/parallaxes/FT_MagCentral_NightGlow
 * @requiredAssets img/parallaxes/FT_MagStrawberry_Reflect
 * @requiredAssets img/parallaxes/FT_MagStrawberry_Shadow
 * @requiredAssets img/parallaxes/FT_MagStrawberry_Light
 * @requiredAssets img/parallaxes/FT_MagStrawberry_Glow
 * @requiredAssets img/parallaxes/FT_MagStrawberry_NightShade
 * @requiredAssets img/parallaxes/FT_MagStrawberry_NightGlow
 * @requiredAssets img/parallaxes/FT_MagStation_Shadow
 * @requiredAssets img/parallaxes/FT_MagStation_Light
 * @requiredAssets img/parallaxes/FT_MagStation_Glow
 * @requiredAssets img/parallaxes/FT_MagStation_NightShade
 * @requiredAssets img/parallaxes/FT_MagStation_NightGlow
 * @requiredAssets img/parallaxes/FT_SouthGatePark_Reflect
 * @requiredAssets img/parallaxes/FT_SouthGatePark_Shadow
 * @requiredAssets img/parallaxes/FT_SouthGatePark_Light
 * @requiredAssets img/parallaxes/FT_SouthGatePark_Glow
 * @requiredAssets img/parallaxes/FT_SouthGatePark_NightShade
 * @requiredAssets img/parallaxes/FT_SouthGatePark_NightGlow
 * @requiredAssets img/parallaxes/FT_Forest_Reflect
 * @requiredAssets img/parallaxes/FT_Forest_Shadow
 * @requiredAssets img/parallaxes/FT_Forest_Light
 * @requiredAssets img/parallaxes/FT_Forest_Glow
 * @requiredAssets img/parallaxes/FT_GuildHall_Reflect
 * @requiredAssets img/parallaxes/FT_GuildHall_Shadow
 * @requiredAssets img/parallaxes/FT_GuildHall_Light
 * @requiredAssets img/parallaxes/FT_GuildHall_Glow
 * @requiredAssets img/parallaxes/FT_GuildHall_NightShade
 * @requiredAssets img/parallaxes/FT_GuildHall_NightLight
 * @requiredAssets img/parallaxes/FT_GuildHall_NightGlow
 * @requiredAssets img/parallaxes/FT_House_Reflect
 * @requiredAssets img/parallaxes/FT_House_Shadow
 * @requiredAssets img/parallaxes/FT_House_Light
 * @requiredAssets img/parallaxes/FT_House_Glow
 * @requiredAssets img/parallaxes/FT_House_NightShade
 * @requiredAssets img/parallaxes/FT_House_NightLight
 * @requiredAssets img/parallaxes/FT_House_NightGlow
 * @requiredAssets img/parallaxes/FT_MagicShop_Reflect
 * @requiredAssets img/parallaxes/FT_MagicShop_Shadow
 * @requiredAssets img/parallaxes/FT_MagicShop_Light
 * @requiredAssets img/parallaxes/FT_MagicShop_Glow
 * @requiredAssets img/parallaxes/FT_MagicShop_NightShade
 * @requiredAssets img/parallaxes/FT_MagicShop_NightLight
 * @requiredAssets img/parallaxes/FT_MagicShop_NightGlow
 * @requiredAssets img/parallaxes/FT_Library_Reflect
 * @requiredAssets img/parallaxes/FT_Library_Shadow
 * @requiredAssets img/parallaxes/FT_Library_Light
 * @requiredAssets img/parallaxes/FT_Library_Glow
 * @requiredAssets img/parallaxes/FT_Library_NightShade
 * @requiredAssets img/parallaxes/FT_Library_NightLight
 * @requiredAssets img/parallaxes/FT_Library_NightGlow
 * @requiredAssets img/parallaxes/FT_Inn_Reflect
 * @requiredAssets img/parallaxes/FT_Inn_Shadow
 * @requiredAssets img/parallaxes/FT_Inn_Light
 * @requiredAssets img/parallaxes/FT_Inn_Glow
 * @requiredAssets img/parallaxes/FT_Inn_NightShade
 * @requiredAssets img/parallaxes/FT_Inn_NightLight
 * @requiredAssets img/parallaxes/FT_Inn_NightGlow
 * @requiredAssets img/parallaxes/FT_BathHouse_Reflect
 * @requiredAssets img/parallaxes/FT_BathHouse_Shadow
 * @requiredAssets img/parallaxes/FT_BathHouse_Light
 * @requiredAssets img/parallaxes/FT_BathHouse_Glow
 * @requiredAssets img/parallaxes/FT_BathHouse_NightShade
 * @requiredAssets img/parallaxes/FT_BathHouse_NightLight
 * @requiredAssets img/parallaxes/FT_BathHouse_NightGlow
 * @requiredAssets img/parallaxes/FT_Armory_Reflect
 * @requiredAssets img/parallaxes/FT_Armory_Shadow
 * @requiredAssets img/parallaxes/FT_Armory_Light
 * @requiredAssets img/parallaxes/FT_Armory_Glow
 * @requiredAssets img/parallaxes/FT_Armory_NightShade
 * @requiredAssets img/parallaxes/FT_Armory_NightLight
 * @requiredAssets img/parallaxes/FT_Armory_NightGlow
 * @requiredAssets img/parallaxes/FT_Cathedral_Reflect
 * @requiredAssets img/parallaxes/FT_Cathedral_Shadow
 * @requiredAssets img/parallaxes/FT_Cathedral_Light
 * @requiredAssets img/parallaxes/FT_Cathedral_Glow
 * @requiredAssets img/parallaxes/FT_Cathedral_NightShade
 * @requiredAssets img/parallaxes/FT_Cathedral_NightLight
 * @requiredAssets img/parallaxes/FT_Cathedral_NightGlow
 * @requiredAssets img/parallaxes/FT_ThroneRoom_Reflect
 * @requiredAssets img/parallaxes/FT_ThroneRoom_Shadow
 * @requiredAssets img/parallaxes/FT_ThroneRoom_Light
 * @requiredAssets img/parallaxes/FT_ThroneRoom_Glow
 * @requiredAssets img/parallaxes/FT_ThroneRoom_NightShade
 * @requiredAssets img/parallaxes/FT_ThroneRoom_NightLight
 * @requiredAssets img/parallaxes/FT_ThroneRoom_NightGlow
 * @requiredAssets img/parallaxes/FT_Cellar_Reflect
 * @requiredAssets img/parallaxes/FT_Cellar_Shadow
 * @requiredAssets img/parallaxes/FT_Cellar_Light
 * @requiredAssets img/parallaxes/FT_Cellar_Glow
 * @requiredAssets img/parallaxes/FT_Cellar_NightShade
 * @requiredAssets img/parallaxes/FT_Cellar_NightLight
 * @requiredAssets img/parallaxes/FT_Cellar_NightGlow
 * @requiredAssets img/parallaxes/FT_NatsuClearing_Reflect
 * @requiredAssets img/parallaxes/FT_NatsuClearing_Shadow
 * @requiredAssets img/parallaxes/FT_NatsuClearing_Light
 * @requiredAssets img/parallaxes/FT_NatsuClearing_Glow
 * @requiredAssets img/parallaxes/FT_NatsuClearing_NightShade
 * @requiredAssets img/parallaxes/FT_NatsuClearing_NightGlow
 * @requiredAssets img/parallaxes/FT_NatsuHouse_Reflect
 * @requiredAssets img/parallaxes/FT_NatsuHouse_Shadow
 * @requiredAssets img/parallaxes/FT_NatsuHouse_Light
 * @requiredAssets img/parallaxes/FT_NatsuHouse_Glow
 * @requiredAssets img/parallaxes/FT_NatsuHouse_NightShade
 * @requiredAssets img/parallaxes/FT_NatsuHouse_NightLight
 * @requiredAssets img/parallaxes/FT_NatsuHouse_NightGlow
 * @requiredAssets img/parallaxes/FT_MagnoliaHill_Shadow
 * @requiredAssets img/parallaxes/FT_MagnoliaHill_Light
 * @requiredAssets img/parallaxes/FT_MagnoliaHill_Glow
 * @requiredAssets img/parallaxes/FT_MagnoliaHill_NightShade
 * @requiredAssets img/parallaxes/FT_MagnoliaHill_NightGlow
 * @requiredAssets img/parallaxes/FT_Hargeon_Reflect
 * @requiredAssets img/parallaxes/FT_Hargeon_Shadow
 * @requiredAssets img/parallaxes/FT_Hargeon_Light
 * @requiredAssets img/parallaxes/FT_Hargeon_Glow
 * @requiredAssets img/parallaxes/FT_Hargeon_NightShade
 * @requiredAssets img/parallaxes/FT_Hargeon_NightGlow
 * @requiredAssets img/parallaxes/FT_AkaneBeach_Reflect
 * @requiredAssets img/parallaxes/FT_AkaneBeach_Shadow
 * @requiredAssets img/parallaxes/FT_AkaneBeach_Light
 * @requiredAssets img/parallaxes/FT_AkaneBeach_Glow
 * @requiredAssets img/parallaxes/FT_AkaneBeach_NightShade
 * @requiredAssets img/parallaxes/FT_AkaneBeach_NightGlow
 * @requiredAssets img/parallaxes/FT_AkaneHotel_Reflect
 * @requiredAssets img/parallaxes/FT_AkaneHotel_Shadow
 * @requiredAssets img/parallaxes/FT_AkaneHotel_Light
 * @requiredAssets img/parallaxes/FT_AkaneHotel_Glow
 * @requiredAssets img/parallaxes/FT_AkaneHotel_NightShade
 * @requiredAssets img/parallaxes/FT_AkaneHotel_NightLight
 * @requiredAssets img/parallaxes/FT_AkaneHotel_NightGlow
 * @requiredAssets img/parallaxes/FT_MountHakobe_Reflect
 * @requiredAssets img/parallaxes/FT_MountHakobe_Shadow
 * @requiredAssets img/parallaxes/FT_MountHakobe_Light
 * @requiredAssets img/parallaxes/FT_MountHakobe_Glow
 * @requiredAssets img/parallaxes/FT_MountHakobe_NightShade
 * @requiredAssets img/parallaxes/FT_MountHakobe_NightGlow
 * @requiredAssets img/parallaxes/FT_HakobeCave_Reflect
 * @requiredAssets img/parallaxes/FT_HakobeCave_Shadow
 * @requiredAssets img/parallaxes/FT_HakobeCave_Light
 * @requiredAssets img/parallaxes/FT_HakobeCave_Glow
 * @requiredAssets img/parallaxes/FT_HakobeCave_NightShade
 * @requiredAssets img/parallaxes/FT_HakobeCave_NightLight
 * @requiredAssets img/parallaxes/FT_HakobeCave_NightGlow
 * @requiredAssets img/parallaxes/FT_GalunaIsland_Reflect
 * @requiredAssets img/parallaxes/FT_GalunaIsland_Shadow
 * @requiredAssets img/parallaxes/FT_GalunaIsland_Light
 * @requiredAssets img/parallaxes/FT_GalunaIsland_Glow
 * @requiredAssets img/parallaxes/FT_GalunaIsland_NightShade
 * @requiredAssets img/parallaxes/FT_GalunaIsland_NightGlow
 */

(() => {
    "use strict";
    const PLUGIN_NAME = "FT_MapLayers";
    const params = PluginManager.parameters(PLUGIN_NAME);
    const NIGHT_SWITCH = Number(params.nightSwitch || 0);
    const FADE = Math.max(0, Number(params.fadeFrames || 0));
    const FOLDER = String(params.folder || "img/parallaxes/").replace(/\/*$/, "/");
    const BLEND = { normal: 0, add: 1, additive: 1, multiply: 2, screen: 3 };
    const TAG = /<FTLayer:\s*([^,>]+?)\s*(?:,\s*([A-Za-z]+)\s*)?(?:,\s*(\d+)\s*)?(?:,\s*(day|night|always)\s*)?(?:,\s*(above|below)\s*)?>/gi;
    const BELOW_Z = 0.5; // tilemap z: lower tiles are 0, characters 1 / 3 / 5, upper tiles 4

    const strength = {
        day: Number(params.dayOpacity === undefined ? 100 : params.dayOpacity) / 100,
        night: Number(params.nightOpacity === undefined ? 100 : params.nightOpacity) / 100,
        always: 1
    };

    PluginManager.registerCommand(PLUGIN_NAME, "setStrength", args => {
        const group = String(args.group || "day");
        if (group in strength) {
            strength[group] = Math.max(0, Math.min(100, Number(args.strength || 0))) / 100;
        }
    });

    function parseLayers() {
        const list = [];
        const note = $dataMap && $dataMap.note ? $dataMap.note : "";
        TAG.lastIndex = 0;
        let m;
        while ((m = TAG.exec(note))) {
            const blend = BLEND[(m[2] || "normal").toLowerCase()];
            list.push({
                file: m[1].trim(),
                blend: blend === undefined ? 0 : blend,
                opacity: m[3] === undefined ? 255 : Math.min(255, Number(m[3])),
                when: (m[4] || "always").toLowerCase(),
                below: (m[5] || "above").toLowerCase() === "below"
            });
        }
        return list;
    }

    function isNight() {
        return NIGHT_SWITCH > 0 && $gameSwitches.value(NIGHT_SWITCH);
    }

    function goalFor(when) {
        if (when === "always") return strength.always;
        const active = (when === "night") === isNight();
        return active ? strength[when] : 0;
    }

    class Sprite_FTMapLayer extends Sprite {
        initialize(def) {
            super.initialize(ImageManager.loadBitmap(FOLDER, def.file));
            this._def = def;
            this.blendMode = def.blend;
            this.z = def.below ? BELOW_Z : 0;
            this._factor = goalFor(def.when);
            this.updateLayer();
        }

        update() {
            super.update();
            this.updateLayer();
        }

        updateLayer() {
            const goal = goalFor(this._def.when);
            if (FADE <= 0) {
                this._factor = goal;
            } else if (this._factor < goal) {
                this._factor = Math.min(goal, this._factor + 1 / FADE);
            } else if (this._factor > goal) {
                this._factor = Math.max(goal, this._factor - 1 / FADE);
            }
            this.opacity = Math.round(this._def.opacity * this._factor);
            this.visible = this.opacity > 0;
            this.x = -Math.ceil($gameMap.displayX() * $gameMap.tileWidth());
            this.y = -Math.ceil($gameMap.displayY() * $gameMap.tileHeight());
        }
    }

    const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _Spriteset_Map_createLowerLayer.call(this);
        this.createFtMapLayers();
    };

    Spriteset_Map.prototype.createFtMapLayers = function() {
        this._ftMapLayers = [];
        for (const def of parseLayers()) {
            const sprite = new Sprite_FTMapLayer(def);
            if (def.below && this._tilemap) {
                // inside the tilemap: sorted by z between the lower tiles and the characters
                this._tilemap.addChild(sprite);
            } else {
                this._baseSprite.addChild(sprite);
            }
            this._ftMapLayers.push(sprite);
        }
    };
})();
