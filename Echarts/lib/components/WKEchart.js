import React, {Component} from 'react';
import {Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import Echarts from "../src/chart";

const ScreenWidth = Dimensions.get('window').width;

/**
 * 目前支持：
 *         纯折线图（多条）
 *         纯柱状图（多条）
 */

export default class WKEchart extends Component {

    static propTypes = {
        /**
         * option的格式必须为：
         *             {
         *                 xData: [],
         *                 yData: [[], [], ...],
         *                 lineChartOption: {
         *                     series: [
         *                     {
         *                          type: 'line',
                                    name: 'title1',
                                    unit: '%',
                                    color: 'red', // 可选，默认是主题色蓝色
                                    stack: "one", // 可选，柱状图堆叠样式
                                    step: 'start',// 可选，如果想要阶梯状的折线图就传这个属性
         *                     },{
         *                          type: 'line',
                                    name: 'title',
                                    unit: '%',
                                    color: 'green',
                                    stack: "one",
                                    step: 'start',
         *                     },
         *                     ...]
         *                 },
         *                 legend: {
         *                      show: true, // 可选，是否显示图例
         *                 }
         *             }
         */
        option: PropTypes.any.isRequired, // 为了方便在外面设置初始值，这里允许传任意类型，这个类中已经对其做了安全检查
        width: PropTypes.number,      // 图标宽度，默认屏幕宽
        height: PropTypes.number,     // 图表高度， 默认260
        yAxisUnit: PropTypes.string,  // y轴单位，默认为:""。目前我们只允许一个y轴，所以y轴显示单位我们单独传值进来
        /**
         * 是否需要显示图例，默认不显示. 前提条件是lineChartOption.series中返回了name，并且也取决于 legend.show 字段
         * 例如：如果 legend.show有值, 并且lineChartOption.series[index].name存在, 那么无论传 showLegend 无效
         *      如果 legend.show不存在，那么是否显示图例取决于 showLegend， 当然，默认是不显示！
         */
        showLegend: PropTypes.bool,
        showShadow: PropTypes.bool,  // 可选，完全由本地来控制。是否显示折线的阴影，默认是不显示
        symbolType: PropTypes.string,// 可选，完全由本地来控制。小圆点类型，默认是空心小圆点. 如果需要实心小圆点可以传 'circle'， 其他可以见官网配置项
        showSymbol: PropTypes.bool,  // 可选，完全由本地来控制。是否显示折线上的小圆点，默认不显示
        smooth: PropTypes.bool,      // 可选, 完全由本地来控制。是否使用光滑的曲线，默认是true
        emptyXData: PropTypes.string, // 可选，完全由本地来控制，当数据为空时，x轴显示什么。默认是'No data'
        /**
         * 可选，x轴类型，完全由本地来控制, 默认是 "category", 目前只支持："category"、"value"
         * y轴不需要指定，由x轴决定，并且总是与x轴相反，即x轴是 "category"， y轴就是 "value"
         */
        xAxisType: PropTypes.string,
    };

    static defaultProps = {
        width: ScreenWidth,
        height: 260,
        yAxisUnit: '',
        showLegend: false,
        showShadow: false,
        symbolType: 'emptyCircle',
        showSymbol: false,
        smooth: true,
        xAxisType: 'category',
        emptyXData: 'No data',
    };

    constructor(props) {
        super(props);
        this.state = {
            option: this._getOption(),
        };
    }

    componentDidUpdate(nextProps, nextState) {
        const {option} = this.props;
        if (option
            && option !== nextProps.option
            && JSON.stringify(option) !== JSON.stringify(nextProps.option)
        ) {
            this.setState({
                option: this._getOption(),
            });
        }
    }

    // 处理浮框中的数据（当x轴非类目轴时，这种情况一般比较少，特殊处理 -- 损耗分析）
    _tooltipFormatterOnAxisValue = (params) => {
        let symbolIndex0 = params[0].seriesName.indexOf('@');
        const hasSymbol0 = symbolIndex0 >= 0;
        const seriesName0 = hasSymbol0 ? params[0].seriesName.substring(0, symbolIndex0) : params[0].seriesName;
        let htmlStr = '<div>' + seriesName0 + '<br/>';
        for (let i = 0, l = params.length; i < l; i++) {
            const color = params[i].color; // 小圆点的颜色
            htmlStr += '<span style="margin-right:5px;display:inline-block;width:10px;height:10px;border-radius:5px;background-color:' + color + ';"></span>';
            let symbolIndex = params[i].seriesName.indexOf('@');
            const hasSymbol = symbolIndex >= 0;
            symbolIndex += 1;
            const unit = hasSymbol ? params[i].seriesName.substr(symbolIndex) : '';
            htmlStr += params[0].name + '\:' + (params[i].data !== undefined ? params[i].data : '-') + unit + '<br/>';
        }
        htmlStr += '</div>';
        return htmlStr;
    };

    // 处理浮框中的数据
    _tooltipFormatter = (params) => {
        let htmlStr = '<div>' + params[0].name + '<br/>';
        for (let i = 0, l = params.length; i < l; i++) {
            const color = params[i].color; // 小圆点的颜色
            htmlStr += '<span style="margin-right:5px;display:inline-block;width:10px;height:10px;border-radius:5px;background-color:' + color + ';"></span>';
            let symbolIndex = params[i].seriesName.indexOf('@');
            const hasSymbol = symbolIndex >= 0;
            const seriesName = hasSymbol ? params[i].seriesName.substring(0, symbolIndex) : params[i].seriesName;
            symbolIndex += 1;
            const unit = hasSymbol ? params[i].seriesName.substr(symbolIndex) : '';
            htmlStr += seriesName + '\:' + (params[i].data !== undefined ? params[i].data : '-') + unit + '<br/>';
        }
        htmlStr += '</div>';
        return htmlStr;
    };

    // // 将浮框限制在图表中，以防tooltip中标题太长时移动到屏幕外看不见
    // _tooltipPosition = (point, params, dom) => {
    //     const posDisX = window.innerWidth - dom.offsetWidth;
    //     const posDisY = 250 - dom.offsetHeight;
    //     if (posDisX < point[0]) {
    //         return posDisY < point[1] ? [posDisX - 10, '25%'] : [posDisX - 10, '40%'];
    //     } else {
    //         return posDisY < point[1] ? [point[0] + 10, '25%'] : [point[0] + 10, '40%'];
    //     }
    // };

    _tooltipPosition = (point, params, dom) => {
        const posDisX = window.innerWidth - dom.offsetWidth;
        const posDisY = 250 - dom.offsetHeight;
        if (posDisX < point[0]) {
            if (posDisY < point[1]) {
                // Bottom-right
                return [posDisX - 10, '25%'];
            }
            // Top-right
            return [posDisX - 15, '40%'];
        } else {
            // Bottom-left
            if (posDisY < point[1]) {
                return [point[0] - 10, '30%'];
            }
            // Top-left
            if (point[0] > window.innerWidth / 3.0) {
                return ['20%', '50%'];
            }
            return [point[0] - 30, '50%'];
        }
    };

    _isNumber = value => typeof value === 'number';

    _getOption = () => {

        let {
            option,
            yAxisUnit,
            showLegend,
            showShadow,
            symbolType,
            showSymbol,
            xAxisType,
            smooth,
            emptyXData,
        } = this.props;

        let xData = [emptyXData];
        let yData = [];
        let showToolTip = false;
        let isBarChart = true;
        const legendData = [];
        let currentOutOfLimit = null;
        let yMaxValue = null;
        if (option
            && option.yData
            && Array.isArray(option.yData)
            && option.yData.length
            && option.yData.every(item => Array.isArray(item))
            && option.yData.some(item => item.length > 0)
            && option.xData
            && Array.isArray(option.xData)
            && option.xData.length
        ) {

            if (this._isNumber(option.currentOutOfLimit)) {
                currentOutOfLimit = option.currentOutOfLimit;
            }

            // // 防止有阈值的情况，阈值不显示(上线前产品又说阈值超过yData的值不显示了 -- 10月23日周三 15:57)
            // option.yData.forEach(item => {
            //     if (item.length && this._isNumber(option.currentOutOfLimit)) {
            //         const maxItem = item.sort()[item.length - 1];
            //         yMaxValue = option.currentOutOfLimit > maxItem ? option.currentOutOfLimit : maxItem;
            //     }
            // });

            yData = option.yData;

            // x轴必须要在y轴有值的情况下显示数据，否则显示"暂无数据"，所以放在这里面判断
            if (option
                && option.xData
                && Array.isArray(option.xData)
                && option.xData.length
            ) {
                xData = option.xData;
                showToolTip = true;
            }
            const {lineChartOption, legend} = option;
            if ((!lineChartOption
                || typeof lineChartOption !== 'object'
                || !lineChartOption.series
                || !Array.isArray(lineChartOption.series)
                || !lineChartOption.series.length
                || lineChartOption.series.length !== yData.length)
                && xAxisType !== 'value' // x轴必须为“category”
            ) {
                const error = {
                    error: 'invalid option.lineChartOption, please check your option structure!!!',
                    file: 'wanke/src/Common/Components/WKEcharts.js',
                    line: 233,
                };
                __DEV__ && console.error(JSON.stringify(error, null, 4));
            } else {
                lineChartOption.series.forEach(item => {
                    const {name, unit} = item;
                    if (name) {
                        legendData.push(`${name}@${unit}`);
                    }
                });
                isBarChart = lineChartOption.series.every(item => item.type === 'bar');
            }
        }

        // 图例是否显示，优先由服务端返回字段 legend 来决定，否则就本地控制
        if (option && option.legend && typeof option.legend.show === 'boolean') {
            showLegend = option.legend.show;
        }

        return {
            tooltip: {
                trigger: 'axis',
                confine: true,
                show: showToolTip,
                formatter: xAxisType === 'value' ? this._tooltipFormatterOnAxisValue : this._tooltipFormatter,
                position: this._tooltipPosition,
                backgroundColor: 'white',// 背景颜色
                borderColor: "#badafa",  // 边框颜色
                borderWidth: 1,          // 边框线宽
                padding: 2,              // 内边距，具体值比如：5，也可以是数组：[5,10,5,10] （表示上、右、下、左）
                textStyle: {
                    color: '#0273f2', // 字体颜色
                    fontSize: 12,     // 字体大小
                },
                axisPointer: {
                    lineStyle: {
                        color: '#CECECE', // 点击tooltip时的竖直线的颜色
                        width: 1,        // 竖线宽度
                    },
                },
            },
            legend: {
                show: showLegend,
                data: legendData,
                formatter: function (name) {
                    const symbolIndex = name.indexOf('@');
                    const hasSymbol = symbolIndex >= 0;
                    return hasSymbol ? name.substring(0, symbolIndex) : name;
                },
                icon: 'roundRect',
                itemWidth: 13,
                itemHeight: 6,
                itemGap: 12,
                textStyle: {
                    fontSize: 11,
                    color: "#999999",
                },
                top: 'bottom',
            },
            grid: { // 图表的内边距
                top: '12%',  // 40
                right: '6%', // 20
                bottom: showLegend ? 45 : 30,
                left: '12%', // 30
            },
            dataZoom: [{ // 缩放功能
                type: 'inside',
                // fillerColor结合borderColor设置成白色为了隐藏缩放条
                fillerColor: 'white',
                borderColor: 'white',
            }],
            xAxis: { // x轴
                type: xAxisType,
                boundaryGap: xAxisType === 'category' ? isBarChart : null, // 曲线是否从0开始，一般柱状图是 true(否则会超出y轴)， 折线图是 false（否则不会从0开始，也就是y轴）
                data: xAxisType === 'category' && xData,
                axisLine: {
                    show: true,          // 是否显示x轴
                    lineStyle: {
                        color: '#CECECE', // x轴及分割线颜色
                    },
                },
                axisLabel: {
                    textStyle: {
                        color: '#676767',  // 值的颜色
                        fontSize: 7,       // 值的字体大小
                    },
                },
                splitLine: {
                    show: false,            // 是否显示x轴所有刻度对应的分割线（平行于y轴）
                    lineStyle: {
                        color: '#CECECE',   // x轴所有刻度对应的分割线的颜色
                    },
                },
            },
            yAxis: { // y轴
                type: xAxisType === 'category' ? 'value' : 'category',
                name: yAxisUnit === '%' ? '' : yAxisUnit,        // 仅仅是y轴单位, 显示在y轴顶部，比如："单位：V"
                data: xAxisType === 'value' && xData,
                nameTextStyle: {
                    color: '#676767',   // y轴单位颜色
                    fontSize: 10        // y轴单位字体大小
                },
                nameGap: 10,            // y轴单位距离y轴顶部距离
                // max: yAxisUnit === '%' ? 100 : null, // 当只有一个数据的百分比会超出一百，这里看需求设置
                min: isBarChart ? null : function (value) { // 针对折线图，让y轴的圆点不要从0开始显示
                    return value.min - 20;
                },
                max: yMaxValue,
                axisLine: {
                    show: true,          // 是否显示y轴
                    lineStyle: {
                        color: '#CECECE',// y轴及分割线颜色
                    },
                },
                splitLine: {
                    show: false,            // 是否显示y轴所有刻度对应的分割线（平行于x轴）
                    lineStyle: {
                        color: '#CECECE',   // y轴所有刻度对应的分割线的颜色
                    },
                },
                axisLabel: {
                    textStyle: {
                        color: '#676767', // 值的颜色
                        fontSize: 7,      // 值的字体大小
                    },
                    formatter: yAxisUnit === '%' ? `{value}%` : `{value}`, // y轴模板
                },
            },
            series: yData.map((arr, index) => {
                const {lineChartOption} = option;
                const {series} = lineChartOption;
                const {
                    type,
                    color,
                    name,
                    unit,
                    stack,
                    step,
                } = series[index];
                return {
                    type: type || 'line',
                    label: {
                        normal: {
                            show: false, // 是否在折线或柱状图里面显示数据，默认不显示
                        }
                    },
                    barMaxWidth: 20,           // 针对柱状图📊，最大宽度
                    name: `${name}@${unit}`,   // 提示浮框tooltip的标题，格式必须为: "title" + "@" + "单位"， 比如: "总负荷@kW"
                    step: step,         // 3个选择: "start"、"middle"、"end", 都表示使用“阶梯状”的折线图，如果需要曲线就一定要传: null
                    stack: isBarChart ? stack : null,       // 这个用于多个数据放在同一个柱状图上（堆叠样式柱状）
                    smooth: smooth,       // 使用平滑的曲线还是直线
                    symbol: symbolType,   // 小圆点的类型
                    symbolSize: 6,      // 小圆点大小
                    showSymbol: showSymbol,   // 是否显示每个数据的小圆点
                    data: arr,
                    lineStyle: {
                        normal: {
                            color: color || '#0273f2', // 折线的颜色
                            width: 1,                  // 折线的宽度
                            shadowColor: color,        // 折线的阴影色
                            shadowBlur: showShadow ? 10 : 0,// 折线的阴影色渲染程度, 0表示不显示阴影
                        },
                    },
                    markLine: { // 设置阈值，平行于x轴的某一个具体值
                        silent: false,
                        data: currentOutOfLimit ? [{
                            type: '', // 阈值：
                            yAxis: currentOutOfLimit
                        }] : [],
                        label: {
                            normal: {
                                show: true,
                                position: 'end',
                                formatter: function (params) {
                                    return params.data.type + params.data.value;
                                }
                            },
                        },
                        // symbolSize: 8, // 箭头或其他大小
                        symbol: ['none', 'none'], // 阈值线开始的点的类型， 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
                        lineStyle: {
                            normal: {
                                type: 'solid',
                                color: '#0273f2',
                            }
                        }
                    },
                    itemStyle: {
                        emphasis: { // 点击柱状图时，会有强调的阴影色
                            barBorderWidth: 1,
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowOffsetY: 0,
                            shadowColor: 'rgba(0,0,0,0.5)',
                        },
                        normal: {
                            /** 点击折线的点的颜色、tooltip中浮框中显示的点的颜色（这个也可以在tooltip的formatter函数中单独修改小圆点的颜色）
                             *  正常情况：当x轴为 'category' 时， 我们直接使用返回数据结构里的lineChartOption.series[index].color
                             *  当y轴为 'category' 时，需要特殊指定类目轴对应的每条柱状图有不同的颜色，就只能使用函数的形式来指定实现
                             *  注意：函数形式适用于 1. 没有图例legend（因为没法改变图例颜色）2. series的data只有一个数组，即y轴只有一个数组。
                             **/
                            color: xAxisType === 'category' ? (color || '#0273f2') : function (params) {
                                const colorList = [
                                    '#0271f2',
                                    '#af92fe',
                                    '#f9733e',
                                    '#39bcce',
                                    '#C33531',
                                    '#EFE42A',
                                    '#64BD3D',
                                    '#0AAF9F',
                                    '#E89589',
                                    '#BA4A00',
                                    '#616A6B',
                                    '#4A235A',
                                ];
                                return colorList[params.dataIndex];
                            },
                        },
                    },
                };
            }),
        };
    };

    render() {
        const {
            width,
            height,
        } = this.props;
        const {option} = this.state;
        return (<Echarts
            option={option}
            width={width}
            height={height}
        />);
    };

}
