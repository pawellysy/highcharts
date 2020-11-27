/**
 *
 *  (c) 2010-2020 Kamil Kulig
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';
import type {
    SMAOptions,
    SMAParamsOptions
} from '../SMA/SMAOptions';
import BaseSeries from '../../../Core/Series/Series.js';
const {
    seriesTypes: {
        sma: SMAIndicator
    }
} = BaseSeries;
import U from '../../../Core/Utilities.js';
const {
    isArray,
    extend,
    merge
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface LinearRegressionIndicatorParamsOptions
            extends SMAParamsOptions {
            xAxisUnit?: number;
        }

        interface LinearRegressionIndicatorOptions extends SMAOptions {
            params?: LinearRegressionIndicatorParamsOptions;
            tooltip?: TooltipOptions;
        }

        interface LinearRegressionSlopesIndicatorOptions
            extends LinearRegressionIndicatorOptions {
            // for inheritance
        }

        interface LinearRegressionInterceptIndicatorOptions
            extends LinearRegressionIndicatorOptions {
            // for inheritance
        }

        interface LinearRegressionAngleIndicatorOptions
            extends LinearRegressionIndicatorOptions {
            tooltip?: TooltipOptions;
        }

        interface RegressionLineParametersObject {
            slope: number;
            intercept: number;
        }
    }
}

/**
 * Linear regression series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.linearregression
 *
 * @augments Highcharts.Series
 */
class LinearRegressionIndicator extends SMAIndicator {
    /**
     * Linear regression indicator. This series requires `linkedTo` option to be
     * set.
     *
     * @sample {highstock} stock/indicators/linear-regression
     *         Linear regression indicator
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/regressions
     * @optionparent plotOptions.linearregression
     */
    public static defaultOptions: Highcharts.LinearRegressionIndicatorParamsOptions = merge(
        SMAIndicator.defaultOptions, {
            params: {
                /**
                 * Unit (in milliseconds) for the x axis distances used to compute
                 * the regression line paramters (slope & intercept) for every
                 * range. In Highstock the x axis values are always represented in
                 * milliseconds which may cause that distances between points are
                 * "big" integer numbers.
                 *
                 * Highstock's linear regression algorithm (least squares method)
                 * will utilize these "big" integers for finding the slope and the
                 * intercept of the regression line for each period. In consequence,
                 * this value may be a very "small" decimal number that's hard to
                 * interpret by a human.
                 *
                 * For instance: `xAxisUnit` equealed to `86400000` ms (1 day)
                 * forces the algorithm to treat `86400000` as `1` while computing
                 * the slope and the intercept. This may enchance the legiblitity of
                 * the indicator's values.
                 *
                 * Default value is the closest distance between two data points.
                 *
                 * @sample {highstock} stock/plotoptions/linear-regression-xaxisunit
                 *         xAxisUnit set to 1 minute
                 *
                 * @example
                 * // In Liniear Regression Slope Indicator series `xAxisUnit` is
                 * // `86400000` (1 day) and period is `3`. There're 3 points in the
                 * // base series:
                 *
                 * data: [
                 *   [Date.UTC(2020, 0, 1), 1],
                 *   [Date.UTC(2020, 0, 2), 3],
                 *   [Date.UTC(2020, 0, 3), 5]
                 * ]
                 *
                 * // This will produce one point in the indicator series that has a
                 * // `y` value of `2` (slope of the regression line). If we change
                 * // the `xAxisUnit` to `1` (ms) the value of the indicator's point
                 * // will be `2.3148148148148148e-8` which is harder to interpert
                 * // for a human.
                 *
                 * @type    {number}
                 * @product highstock
                 */
                xAxisUnit: void 0
            },
            tooltip: {
                valueDecimals: 4
            }
        } as Highcharts.LinearRegressionIndicatorParamsOptions);

    /* *
     *
     *  Properties
     *
     * */
    public data: Array<LinearRegressionIndicatorPoint> = void 0 as any;
    public options: Highcharts.LinearRegressionIndicatorOptions = void 0 as any;
    public points: Array<LinearRegressionIndicatorPoint> = void 0 as any;

    /**
     * Return the slope and intercept of a straight line function.
     * @private
     * @param {Highcharts.LinearRegressionIndicator} this indicator to use
     * @param {Array<number>} xData -  list of all x coordinates in a period
     * @param {Array<number>} yData - list of all y coordinates in a period
     * @return {Highcharts.RegressionLineParametersObject}
     *          object that contains the slope and the intercept
     *          of a straight line function
     */
    public getRegressionLineParameters(
        this: LinearRegressionIndicator,
        xData: Array<number>,
        yData: Array<number>
    ): Highcharts.RegressionLineParametersObject {
        // least squares method
        var yIndex: number = (this.options.params as any).index,
            getSingleYValue = function (
                yValue: (number|Array<number>),
                yIndex: number
            ): number {
                return isArray(yValue) ? yValue[yIndex] : yValue;
            },
            xSum = xData.reduce(
                function (
                    accX: number,
                    val: number
                ): number {
                    return val + accX;
                }, 0),
            ySum = yData.reduce(
                function (accY: number, val: number): number {
                    return getSingleYValue(val, yIndex) + accY;
                }, 0),
            xMean: number = xSum / xData.length,
            yMean: number = ySum / yData.length,
            xError: number,
            yError: number,
            formulaNumerator = 0,
            formulaDenominator = 0,
            i: number,
            slope: number;

        for (i = 0; i < xData.length; i++) {
            xError = xData[i] - xMean;
            yError = getSingleYValue(yData[i], yIndex) - yMean;
            formulaNumerator += xError * yError;
            formulaDenominator += Math.pow(xError, 2);
        }

        slope = formulaDenominator ?
            formulaNumerator / formulaDenominator : 0; // don't divide by 0

        return {
            slope: slope,
            intercept: yMean - slope * xMean
        };
    }


    /**
     * Return the y value on a straight line.
     * @private
     * @param {Highcharts.RegressionLineParametersObject} lineParameters
     *          object that contains the slope and the intercept
     *          of a straight line function
     * @param {number} endPointX - x coordinate of the point
     * @return {number} - y value of the point that lies on the line
     */
    public getEndPointY(
        lineParameters: Highcharts.RegressionLineParametersObject,
        endPointX: number
    ): number {
        return lineParameters.slope * endPointX + lineParameters.intercept;
    }

    /**
     * Transform the coordinate system so that x values start at 0 and
     * apply xAxisUnit.
     * @private
     * @param {Array<number>} xData - list of all x coordinates in a period
     * @param {number} xAxisUnit - option (see the API)
     * @return {Array<number>} - array of transformed x data
     */
    public transformXData(
        xData: Array<number>,
        xAxisUnit: number
    ): Array<number> {
        var xOffset: number = xData[0];

        return xData.map(function (xValue: number): number {
            return (xValue - xOffset) / xAxisUnit;
        });
    }

    /**
     * Find the closest distance between points in the base series.
     * @private
     * @param {Array<number>} xData list of all x coordinates in the base series
     * @return {number} - closest distance between points in the base series
     */
    public findClosestDistance(
        xData: Array<number>
    ): (number|undefined) {
        var distance: number,
            closestDistance: (number|undefined),
            i: number;

        for (i = 1; i < xData.length - 1; i++) {
            distance = xData[i] - xData[i - 1];
            if (
                distance > 0 &&
                (
                    typeof closestDistance === 'undefined' ||
                    distance < closestDistance
                )
            ) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    // Required to be implemented - starting point for indicator's logic
    public getValues<TLinkedSeries extends LineSeries>(
        this: LinearRegressionIndicator,
        baseSeries: TLinkedSeries,
        regressionSeriesParams:
        Highcharts.LinearRegressionIndicatorParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> {
        var xData: Array<number> = (baseSeries.xData as any),
            yData: Array<number> = (baseSeries.yData as any),
            period: number = (regressionSeriesParams.period as any),
            lineParameters: Highcharts.RegressionLineParametersObject,
            i: number,
            periodStart: number,
            periodEnd: number,
            // format required to be returned
            indicatorData: IndicatorValuesObject<
            TLinkedSeries
            > = {
                xData: [], // by getValues() method
                yData: [],
                values: []
            } as any,
            endPointX: number,
            endPointY: number,
            periodXData: Array<number>,
            periodYData: Array<number>,
            periodTransformedXData: Array<number>,
            xAxisUnit: number = (this.options.params as any).xAxisUnit ||
                this.findClosestDistance(xData);

        // Iteration logic: x value of the last point within the period
        // (end point) is used to represent the y value (regression)
        // of the entire period.

        for (i = period - 1; i <= xData.length - 1; i++) {
            periodStart = i - period + 1; // adjusted for slice() function
            periodEnd = i + 1; // (as above)
            endPointX = xData[i];
            periodXData = xData.slice(periodStart, periodEnd);
            periodYData = yData.slice(periodStart, periodEnd);
            periodTransformedXData = this.transformXData(periodXData,
                xAxisUnit);

            lineParameters = this.getRegressionLineParameters(
                periodTransformedXData, periodYData
            );

            endPointY = this.getEndPointY(lineParameters,
                periodTransformedXData[periodTransformedXData.length - 1]);

            // @todo this is probably not used anywhere
            indicatorData.values.push({
                regressionLineParameters: lineParameters,
                x: endPointX,
                y: endPointY
            } as any);

            indicatorData.xData.push(endPointX);
            indicatorData.yData.push(endPointY as any);
        }

        return indicatorData;
    }
}

class LinearRegressionIndicatorPoint extends SMAIndicator.prototype.pointClass {
    public series: LinearRegressionIndicator = void 0 as any;
}

/* *
 *
 *  Prototype Properties
 *
 * */
interface LinearRegressionIndicator {
    pointClass: typeof LinearRegressionIndicatorPoint;
}

extend(LinearRegressionIndicator.prototype, {
    nameBase: 'Linear Regression Indicator'
});

/**
 * LinearRegressionSlopeIndicator
 */

/**
 * A linear regression series. If the [type](#series.linearregression.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.linearregression
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser,dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/regressions
 * @apioption series.linearregression
 */

/**
 * The Linear Regression Slope series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.linearRegressionSlope
 *
 * @augments Highcharts.Series
 */
class LinearRegressionSlopesIndicator extends LinearRegressionIndicator {
    public static defaultOptions: Highcharts.LinearRegressionIndicatorParamsOptions = LinearRegressionIndicator.defaultOptions as Highcharts.LinearRegressionIndicatorOptions;
    /**
     * Linear regression slope indicator. This series requires `linkedTo`
     * option to be set.
     *
     * @sample {highstock} stock/indicators/linear-regression-slope
     *         Linear regression slope indicator
     *
     * @extends      plotOptions.linearregression
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/regressions
     * @optionparent plotOptions.linearregressionslope
     */
    public data: Array<LinearRegressionSlopesIndicatorPoint> = void 0 as any;
    public options: Highcharts.LinearRegressionIndicatorOptions = void 0 as any;
    public points: Array<LinearRegressionSlopesIndicatorPoint> = void 0 as any;

    public getEndPointY(
        lineParameters: Highcharts.RegressionLineParametersObject
    ): number {
        return lineParameters.slope;
    }
}
/**
 * A linear regression slope series. If the
 * [type](#series.linearregressionslope.type) option is not specified, it is
 * inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.linearregressionslope
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser,dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/regressions
 * @apioption series.linearregressionslope
 */

class LinearRegressionSlopesIndicatorPoint extends LinearRegressionIndicatorPoint {
    public series: LinearRegressionSlopesIndicator = void 0 as any;
}

/* *
 *
 *  Prototype Properties
 *
 * */
interface LinearRegressionSlopesIndicator extends LinearRegressionIndicator {
    pointClass: typeof LinearRegressionSlopesIndicatorPoint;
}

extend(LinearRegressionSlopesIndicator.prototype, {
    nameBase: 'Linear Regression Slope Indicator'
});

/**
 * The Linear Regression Intercept series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.linearRegressionIntercept
 *
 * @augments Highcharts.Series
 */

class LinearRegressionInterceptIndicator extends LinearRegressionIndicator {
    public static defaultOptions: Highcharts.LinearRegressionIndicatorParamsOptions = LinearRegressionIndicator.defaultOptions as Highcharts.LinearRegressionIndicatorOptions;
    /**
     * Linear regression intercept indicator. This series requires `linkedTo`
     * option to be set.
     *
     * @sample {highstock} stock/indicators/linear-regression-intercept
     *         Linear intercept slope indicator
     *
     * @extends      plotOptions.linearregression
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/regressions
     * @optionparent plotOptions.linearregressionintercept
     */
    public data: Array<LinearRegressionInterceptIndicatorPoint> = void 0 as any;
    public options: Highcharts.LinearRegressionIndicatorOptions = void 0 as any;
    public points: Array<LinearRegressionInterceptIndicatorPoint> = void 0 as any;

    public getEndPointY(
        lineParameters: Highcharts.RegressionLineParametersObject
    ): number {
        return lineParameters.intercept;
    }
}

class LinearRegressionInterceptIndicatorPoint extends LinearRegressionIndicatorPoint {
    public series: LinearRegressionInterceptIndicator = void 0 as any;
}

/**
 * A linear regression intercept series. If the
 * [type](#series.linearregressionintercept.type) option is not specified, it is
 * inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.linearregressionintercept
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser,dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/regressions
 * @apioption series.linearregressionintercept
 */

/* *
 *
 *  Prototype Properties
 *
 * */
interface LinearRegressionInterceptIndicator {
    pointClass: typeof LinearRegressionInterceptIndicatorPoint;
}

extend(LinearRegressionInterceptIndicator.prototype, {
    nameBase: 'Linear Regression Intercept Indicator'
});

/**
 * The Linear Regression Angle series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.linearRegressionAngle
 *
 * @augments Highcharts.Series
 */
class LinearRegressionAngleIndicator extends LinearRegressionIndicator {
    public static defaultOptions: Highcharts.LinearRegressionIndicatorParamsOptions = merge(
        SMAIndicator.defaultOptions, {
            tooltip: { // add a degree symbol
                pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                '{series.name}: <b>{point.y}°</b><br/>'
            }
        } as Highcharts.LinearRegressionIndicatorParamsOptions);
    /**
     * Linear regression angle indicator. This series requires `linkedTo`
     * option to be set.
     *
     * @sample {highstock} stock/indicators/linear-regression-angle
     *         Linear intercept angle indicator
     *
     * @extends      plotOptions.linearregression
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/regressions
     * @optionparent plotOptions.linearregressionangle
     */
    public data: Array<LinearRegressionSlopesIndicatorPoint> = void 0 as any;
    public options: Highcharts.LinearRegressionIndicatorOptions = void 0 as any;
    public points: Array<LinearRegressionSlopesIndicatorPoint> = void 0 as any;

    /**
    * Convert a slope of a line to angle (in degrees) between
    * the line and x axis
    * @private
    * @param {number} slope of the straight line function
    * @return {number} angle in degrees
    */
    public slopeToAngle(
        slope: number
    ): number {
        return Math.atan(slope) * (180 / Math.PI); // rad to deg
    }

    public getEndPointY(
        this: LinearRegressionAngleIndicator,
        lineParameters: Highcharts.RegressionLineParametersObject
    ): number {
        return this.slopeToAngle(lineParameters.slope);
    }
}

class LinearRegressionAngleIndicatorPoint extends LinearRegressionIndicatorPoint {
    public series: LinearRegressionAngleIndicator = void 0 as any;
}

extend(LinearRegressionAngleIndicator.prototype, {
    nameBase: 'Linear Regression Angle Indicator'
});

interface LinearRegressionAngleIndicator extends LinearRegressionIndicator {
    pointClass: typeof LinearRegressionAngleIndicatorPoint;
}

/**
 *
 * Register
 *
 */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        linearRegression: typeof LinearRegressionIndicator;
        linearRegressionAngle: typeof LinearRegressionAngleIndicator;
        linearRegressionIntercept: typeof LinearRegressionInterceptIndicator;
        linearRegressionSlope: typeof LinearRegressionSlopesIndicator;
    }
}

BaseSeries.registerSeriesType('linearRegression', LinearRegressionIndicator);
BaseSeries.registerSeriesType('linearRegressionSlope', LinearRegressionSlopesIndicator);
BaseSeries.registerSeriesType('linearRegressionIntercept', LinearRegressionInterceptIndicator);
BaseSeries.registerSeriesType('linearRegressionAngle', LinearRegressionAngleIndicator);


/* *
 *
 *  Default Export
 *
 * */

export default LinearRegressionIndicator;

/**
 * A linear regression intercept series. If the
 * [type](#series.linearregressionangle.type) option is not specified, it is
 * inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.linearregressionangle
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser,dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/regressions
 * @apioption series.linearregressionangle
 */

''; // to include the above in the js output
