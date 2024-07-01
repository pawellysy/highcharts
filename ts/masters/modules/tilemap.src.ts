/**
 * @license Highmaps JS v@product.version@ (@product.date@)
 * @module highcharts/modules/tilemap
 * @requires highcharts
 * @requires modules/map
 *
 * Tilemap module
 *
 * (c) 2010-2024 Highsoft AS
 *
 * License: www.highcharts.com/license
 */
'use strict';
import Highcharts from '../../Core/Globals.js';
import TilemapSeries from '../../Series/Tilemap/TilemapSeries.js';
const G: AnyRecord = Highcharts;
TilemapSeries.compose(G.Axis);
export default Highcharts;
