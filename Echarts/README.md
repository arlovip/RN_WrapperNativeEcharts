# wanke-echarts

`App`的`echarts`组件，用于绘制折线图、柱状图、饼图等等。

## 安装

#### 1. 添加`react-native-webview`依赖

```
npm install --save react-native-webview
react-native link react-native-webview
```

#### 2. 添加`prop-types`依赖

```
npm install --save prop-types
```

> 注：先检查是否已安装`react-native-webview`和`prop-types`，如果已经有了就不需要再安装，`wanke-echarts`需要以上两个依赖，因此必须添加！

#### 3. 添加`wanke-echarts`

- 首先，配置`.npmrc`

进入到项目的根目录下（`node_modules`所在目录），将以下内容**全部**添加到`.npmrc`文件（如果没有就创建一个）

```
registry=https://npm.pkg.github.com/lchenfox
//npm.pkg.github.com/:_authToken=c253d45271561b3a793c7be0a8afaa234dsfa234adf234
```

> 一般情况下，工程目录下会有这个文件，因此，在配置之前，请先查看一下是否已存在这个`.npmrc`文件，如果存在，并且已经有以上内容，那就忽略这个步骤。更重要的是，一个工程只要添加过一次就行了，一般情况下，后续安装其他`npm`依赖包，都不需要再配置。

- 方式1，命令行安装

```
npm install --save @lchenfox/wanke-echarts@1.0.2
```

- 方式2，通过`package.json`安装

在`package.json`依赖中添加以下内容，然后执行`npm install`

```
"@lchenfox/wanke-echarts": "1.0.2"
```

## 配置

#### 添加`tpl.html`文件（Android）

在以上安装成功后，需要对`Android`进行配置，那就是将`node_modules/shufengdong/wanke-echarts/lib/file/tpl.html`文件复制到项目的`android/app/src/main/assets/`目录下，如果没有`assets`目录，就创建一个。

## 使用

- Echarts 

未经封装，可自行按照官方配置使用即可。

- WKEchart

经过对`Echarts`的封装，可在项目中导入直接使用，`option`配置与`Echarts`不同，并且必须严格按照约定传入参数配置，具体参数配置详情可在`WKEchart`里面查看，基本都有说明。

- 代码演示

```
import React, {Component} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Echarts, {WKEchart} from '@shufengdong/wanke-echarts';

export default class App extends Component {

    render() {
        const option1 = {
            xAxis: {
                data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
            },
            yAxis: {},
            series: [{
                name: '销量',
                type: 'bar',
                data: [5, 20, 36, 10, 10, 20],
            }],
        };
        const option2 = {
            xData: ['花花', '狗狗', '猫猫'],
            yData: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
            lineChartOption: {
                series: [
                    {
                        type: 'line',
                        name: 'title1',
                        unit: '%',
                        color: 'red', // 可选，默认是主题色蓝色
                        stack: "one", // 可选，柱状图堆叠样式
                        step: 'start',// 可选，如果想要阶梯状的折线图就传这个属性
                    },
                    {
                        type: 'line',
                        name: 'title1',
                        unit: '%',
                        color: 'green', // 可选，默认是主题色蓝色
                        stack: "one", // 可选，柱状图堆叠样式
                        step: 'start',// 可选，如果想要阶梯状的折线图就传这个属性
                    },
                    {
                        type: 'line',
                        name: 'title1',
                        unit: '%',
                        color: 'blue', // 可选，默认是主题色蓝色
                        stack: "one", // 可选，柱状图堆叠样式
                        step: 'start',// 可选，如果想要阶梯状的折线图就传这个属性
                    },
                ],
            },
        };
        return (
            <View style={styles.container}>
                <Text>Echarts</Text>
                <Echarts option={option1}/>
                <Text>WKEchart</Text>
                <WKEchart option={option2}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
```
