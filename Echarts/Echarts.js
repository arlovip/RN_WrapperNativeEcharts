import React, {Component} from 'react';
import {
    View,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import {WebView} from 'react-native-webview';
import renderChart from "./renderChart";
import iOSSourceUri from './tpl.html';

const {width} = Dimensions.get('window');
const defaultHeight = 250;

export default class Echarts extends Component {

    static propTypes = {
        option: PropTypes.object.isRequired,
        width: PropTypes.number, // Optional, width for container. Default is screen width.
        height: PropTypes.number, // Optional, height for both container and WebView. Default is 250.
        bgColor: PropTypes.string, // Optional, backgroundColor for container. Default is 'white'.
        webviewBgColor: PropTypes.string, // Optional, backgroundColor for WebView. Default is 'transparent'.
    };

    static defaultProps = {
        width: width,
        height: defaultHeight,
        bgColor: 'white',
        webviewBgColor: 'transparent',
    };

    shouldComponentUpdate(nextProps, nextState) {
        const {option} = this.props;
        if (nextProps.option !== option ||
            JSON.stringify(nextProps.option) !== JSON.stringify(option)
        ) {
            this.chart.reload();
        }
        return true;
    }

    render() {

        const {
            width,
            height,
            bgColor,
            webviewBgColor,
            onPress,
        } = this.props;

        const isAndroid = Platform.OS === 'android';
        const source = isAndroid ? {uri: 'file:///android_asset/tpl.html'} : iOSSourceUri;

        const containerStyles = {
            backgroundColor: bgColor,
            width: width,
            height: height,
        };

        const webViewStyles = {
            backgroundColor: webviewBgColor,
            height: height,
        };

        return (<View style={[styles.container, containerStyles]}>
            <WebView
                ref={ref => this.chart = ref}
                useWebKit={true}
                scrollEnabled={false}
                injectedJavaScript={renderChart(this.props)}
                style={webViewStyles}
                originWhitelist={['*']}
                source={source}
                onMessage={event => onPress ? onPress(JSON.parse(event.nativeEvent.data)) : null}
            />
        </View>);
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
});

/**
 * 为什么要用这个WebView ？ 是因为原生的WebView即将在官方ReactNative中被移除
 * 更重要的一点是，当数据量太大时（比如电池分析2天以上的极差、极值），在iOS 12的
 * 新机上，选择日期之后显示的是一片空白，只有点击一下或滑动ScrollView，才会显示
 * 出来，这是一个API造成的bug，因此我们这里使用官方推荐的 react-native-webview.
 * 注意：针对iOS，由于是使用WKWebView, 为了让注入的js文件和手机苹果宽高自适应，
 * 并且不可双击缩放，因此需要在针对iOS的 require('./tpl.html') 中加入
 * <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
 * **/
