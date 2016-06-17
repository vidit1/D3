/**
 * Created by vidit on 6/10/16.
 */
function D3Multiple(obj) {

    d3.selectAll(obj.divId).on('mousemove',null)
        .on('mouseout',null)
        .on('mousedown',null);

    var chart = {};

    var data = obj.series;

    var downloadFlag = false;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom:data.length>25?120:90, left: 50},



        width = ($(obj.divId).width()==0?600:$(obj.divId).width()) - margin.left - margin.right,
        height = obj.height?obj.height:550 - margin.top - margin.bottom;


    var legendToggleTextFlag = false;

    //x
    var x = d3.scale.ordinal()
        .domain([0, 1])
        .rangePoints([0, width], 0.1, 0);

    var xBar = d3.scale.ordinal()
        .domain([0, 1])
        .rangeBand([0, width], 0.1, 0);
    //y
    var y = d3.scale.linear().range([height, margin.top]);


    var y1= d3.scale.linear().range([height, margin.top]);

    var color = d3.scale.category10();

    // Defining xAxis location at bottom the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

    //Defining yAxis location at left the axes
    var yAxis = d3.svg.axis()
        .scale(y)
        .innerTickSize(-width)
        .orient("left");

    //Defining yAxis location at left the axes
    var yAxis1 = d3.svg.axis()
        .scale(y1)
        .innerTickSize(-width)
        .orient("right");


    //graph type line and
    var line = d3.svg.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.y);
        });


    //calling legend and setting width,height,margin,color
    var legend


    var mouseMoveHide = 'visible',
        HoverFlag = true;

    //Setting domain for the colors with te exceptioon of date column
    color.domain(data.map(function (d) {
        return d.label
    }));



    for(var i=0;i<data.length;i++){
        data[i].hover = false
        data[i].disabled = true
    }


    var cities = data;
    var rawData = JSON.parse(JSON.stringify(cities))
    var series, dataLength,zoom = true;

    //HammerJs functionality added
    var div = document.getElementById(obj.divId.indexOf("#")==-1?obj.divId:obj.divId.replace("#",""));
    if(div==null){
        return
    }
    var mc = new Hammer.Manager(div);
    var pinch = new Hammer.Pinch();
    var pan = new Hammer.Pan();
    var tap = new Hammer.Tap();
    var pinchFlag = false,startPointsPinch,endPointsPinch,startLocation = 0,panStart,panEnd;
    pinch.recognizeWith(pan);

    mc.add([pinch, pan,tap]);

    // Prevent long press saving on mobiles.
//        div.addEventListener('touchstart', function (e) {
//            e.preventDefault()
//        });

    if(window.innerWidth<768) {

        mc.on("panstart", function (ev) {
            if (pinchFlag == false) {
                panStart = ev.center;
            }

        });


        mc.on("panend", function (ev) {
            if (pinchFlag == false) {
                panEnd = ev.center;
                var pointsX = [parseInt(parseInt(panStart.x) / (width / x.domain().length)), parseInt(parseInt(panEnd.x) / (width / x.domain().length))]
                var startLength = pointsX[0] - pointsX[1];
                var maxDataLength = 0, rawDataMaxLength = 0;
                cities.forEach(function (d, i) {
                    if (maxDataLength < d.data.length) {
                        maxDataLength = d.data.length;
                    }
                    if (rawDataMaxLength < rawData[i].data.length) {
                        rawDataMaxLength = rawData[i].data.length;
                    }
                });
                if ((startLocation + startLength) < 0) {
                    startLength = startLength - (startLength + startLocation);
                }
                else if ((startLocation + startLength + maxDataLength) >= rawDataMaxLength) {
                    startLength = startLength - ( (startLocation + startLength + maxDataLength) - rawDataMaxLength )
                }
                startLocation = (startLocation + startLength) < 0 ? 0 : (startLocation + startLength);
                cities.forEach(function (d, i) {
                    var dataLength = (startLocation + d.data.length) < rawData[i].data.length ? (startLocation + d.data.length) : rawData[i].data.length;
                    d.data = rawData[i].data.slice(startLocation, dataLength);
                });
                chart.plot()
            }

        });

        mc.on("pinchstart", function (ev) {
            pinchFlag = true;
            startPointsPinch = ev.pointers;

        });

        mc.on("pinchend", function (ev) {
            endPointsPinch = ev.pointers;
            var xpos = parseInt(startPointsPinch[0].clientX), flag = true;
            var startFlag = startPointsPinch[0].clientX < startPointsPinch[1].clientX;
            var xPinch = [
                [//Starting info for x location
                    startFlag == true ? startPointsPinch[0].clientX : startPointsPinch[1].clientX,
                    startFlag == true ? startPointsPinch[1].clientX : startPointsPinch[0].clientX
                ],
                [//Ending info for x location
                    startFlag == true ? endPointsPinch[0].clientX : endPointsPinch[1].clientX,
                    startFlag == true ? endPointsPinch[1].clientX : endPointsPinch[0].clientX
                ]
            ];
            var yPinch = [
                [//Starting info for y location
                    startFlag == true ? startPointsPinch[0].clientY : startPointsPinch[1].clientY,
                    startFlag == true ? startPointsPinch[1].clientY : startPointsPinch[0].clientY
                ],
                [//Ending info for y location
                    startFlag == true ? endPointsPinch[0].clientY : endPointsPinch[1].clientY,
                    startFlag == true ? endPointsPinch[1].clientY : endPointsPinch[0].clientY
                ]
            ];
            console.log("trigger = ",
                (parseInt(parseInt(xPinch[0][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[0][0]) / (width / x.domain().length)))
                <
                (parseInt(parseInt(xPinch[1][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[1][0]) / (width / x.domain().length))) ? "Zoom IN" : "Zoom OUT");

            var startLength = (parseInt(parseInt(xPinch[0][0]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[1][0]) / (width / x.domain().length)));
            var endLength = (parseInt(parseInt(xPinch[1][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[0][1]) / (width / x.domain().length)));
            if ((startLocation + startLength) < 0) {
                startLength = startLength - (startLength + startLocation);
            }
            startLocation = (startLocation + startLength) < 0 ? 0 : (startLocation + startLength);
            //starting filtering data
            var loopingVariable = true;
            cities.forEach(function (d, i) {
                if (loopingVariable == false)
                    return;
//                slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
                if (startLength > 0 && endLength > 0) {
                    if (d.data.length > 10) {
                        d.data = d.data.splice(startLength, d.data.length - endLength);
                    } else {
                        startLocation = startLocation - startLength;
                        loopingVariable = false;
                    }
                }
                else {
                    var dataLength = ((-startLength + d.data.length - endLength) > rawData[i].data.length ? rawData[i].data.length : (-startLength + d.data.length - endLength));
                    dataLength = (startLocation + dataLength - 1) >= rawData[i].data.length ? (rawData[i].data.length - startLocation - 1) : (dataLength - 1);
                    d.data = rawData[i].data.slice(startLocation, startLocation + dataLength);
                }
            });

            chart.plot();

            setTimeout(function () {
                pinchFlag = false;
            }, 500)
        });
    }





    //chart function to create chart
    chart.plot =function () {

        //Empty the container before loading
        d3.selectAll(obj.divId+" > *").remove();


        //Adding chart and placing chart at specific locaion using translate
        var svg = d3.select(obj.divId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Filtering data if the column is disable or not
        series = cities.filter(function (d) {
            return d.disabled;
        });

        legend = d3Legend().height(height + margin.top + margin.bottom).width(width+margin.left+margin.right).margin(margin).color(color);

        //Appending legend box
        svg.append('g')
            .attr('class', 'legendWrap');

        //legend location
        svg.select('.legendWrap').datum(cities)
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            .call(legend);



        //Chart Title
        svg.append('g').attr('class','titleWrap').append('text')
            .attr("x", (width / 2))
            .attr("y",  (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(obj.title.text);


        //Reset Zoom Button
        svg.append('g').attr('class', 'resetZoom')
            .classed("toggleReset", zoom)
            .attr("x", 10)
            .attr("y", -10)
            .style("z-index", 1000)
            .append("rect")  //Appending rectangle styling
            .attr("width", 80)
            .attr("height", 20)
            .attr("x", 10-2)
            .attr("y", -18)
            .attr("rx", 2)
            .style("fill", "#f2f2f2")
            .style("stroke", "#666666")
            .style("stroke-width", "1px");

        d3.select(obj.divId+" > svg > g > g[class='resetZoom']") //Adding reset zoom text to the reset zoom rectangle
            .append("text")
            .attr("x", 10 + 40)
            .attr("y", -10 + 6)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Reset Zoom");

        if(obj.downloadFlag) {
            //Download data button
            svg.append('g').attr('class', 'download')
                .classed('hidden', downloadFlag)
                .style("z-index", 1000)
                .append("rect")
                .attr('x', width)
                .attr("y", 10)
                .attr("rx", 2)
                .style("fill", "#f2f2f2")
                .style("stroke", "#666666")
                .style("stroke-width", "1px")

            d3.select(obj.divId + " > svg > g > g[class='download']").append('text')
                .attr('x', width - 10)
                .attr("y", 10)
                .attr('font-family', 'FontAwesome')
                .attr('font-size', '1.5em')
                .text('\uf0ab')
                .style("cursor", "pointer");

            d3.select(obj.divId+" > svg > g > g[class='download']").on("mousedown",function () {
                downloadAsCsv(rawData,obj.title.text)
            });
        }

        //Graph Detail button
        svg.append('g').attr('class','graphDetails')
            .classed('hidden',downloadFlag)
            .style("z-index",1000)
            .append("rect")
            .attr('x',width)
            .attr("y",10)
            .attr("rx",2)
            .style("fill","#f2f2f2")
            .style("stroke","#666666")
            .style("stroke-width","1px")

        d3.select(obj.divId+" > svg > g > g[class='graphDetails']").append('text')
            .attr('x',width-40)
            .attr("y",10)
            .attr('font-family', 'FontAwesome')
            .attr('font-size', '1.5em')
            .text('\uf05a')
            .style("cursor","pointer");


        d3.select(obj.divId+" > svg > g > g[class='graphDetails']").on("click",function () {
            obj.exporting.buttons.customButton.onclick(obj)
        });
        var qkeyButton={},textLength=0
        if(obj.hasOwnProperty('exporting')&&obj.exporting.buttons.hasOwnProperty('qkeyButton')){
            qkeyButton = obj.exporting.buttons.qkeyButton;
            console.log(qkeyButton);
            if(qkeyButton.type=="legendToggle"){
                textLength = $('<span id="D3TextTemp" style="">'+(legendToggleTextFlag==true?"Select All":"Deselect All")+'</span>').appendTo('body').width();
                $('#D3TextTemp').remove();
                svg.append('g').attr('class', 'qkeyButton')
                    .style("z-index", 1000)
                    .append("rect")
                    .attr('x', width - 10 - textLength -20 + (qkeyButton.x?qkeyButton.x:0 ))
                    .attr("y", 5)
                    .attr("rx", 2)
                    .attr("width",textLength + 10)
                    .style("fill", "#f2f2f2")
                    .style("stroke", "#666666")
                    .style("stroke-width", "1px");

                d3.select(obj.divId + " > svg > g > g[class='qkeyButton']")
                    .append("text")
                    .attr('x', width - 10 - textLength -5 + (qkeyButton.x ? qkeyButton.x : 0) )
                    .attr("y", 5)
                    .attr("text-anchor", "middle")
                    .style("font-size", "15px")
                    .text(legendToggleTextFlag==true?"Select All":"Deselect All")
                    .style('text-decoration','underline')
                    .style('cursor','pointer');

                d3.select(obj.divId + " > svg > g > g[class='qkeyButton']").on('mousedown',function () {
                    cities.forEach(function (d) {
                        d.disabled = legendToggleTextFlag;
                    })
                    legendToggleTextFlag = !legendToggleTextFlag;
                    chart.plot();
                })


            }else {
                textLength = $('<span id="D3TextTemp" style="">' + qkeyButton.text + '</span>').appendTo('body').width();
                $('#D3TextTemp').remove();
                svg.append('g').attr('class', 'qkeyButton')
                    .style("z-index", 1000)
                    .append("rect")
                    .attr('x', width - 10 - textLength - 20 + (qkeyButton.x ? qkeyButton.x : 0 ))
                    .attr("y", 5)
                    .attr("rx", 2)
                    .attr("width", textLength + 10)
                    .style("fill", "#f2f2f2")
                    .style("stroke", "#666666")
                    .style("stroke-width", "1px");

                d3.select(obj.divId + " > svg > g > g[class='qkeyButton']")
                    .append("text")
                    .attr('x', width - 10 - textLength - 5 + (qkeyButton.x ? qkeyButton.x : 0))
                    .attr("y", 5)
                    .attr("text-anchor", "middle")
                    .style("font-size", "15px")
                    .text(qkeyButton.text)
                    .style('text-decoration', 'underline')
                    .style('cursor', 'pointer');

                d3.select(obj.divId + " > svg > g > g[class='qkeyButton']").on('mousedown',function () {
                    qkeyButton.onclick();
                })
            }
        }

        //Click on reset zoom function
        d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown",function () {
            console.log("reset triggered");
            cities.forEach(function (d,i) {
                d.data = rawData[i].data;
            });
            zoom = true;
            chart.plot()

        });

        //check if the data is present or not
        if(series.length==0 || series[0].data.length==0){
            //Chart Title
            svg.append('g').attr('class','noDataWrap').append('text')
                .attr("x", (width / 2))
                .attr("y",  (height / 2))
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .text("No data to display");
            return;
        }

        //storing the length of data so that the check can
        dataLength = series[0].data.length;

        //setting the upper an d lower limit in x - axis
        x.domain(series[0].data.map(function (d) {
            return d.date;
        }));

        //var mult = Math.max(1, Math.floor(width / x.domain().length));
        x.rangePoints([0, width], 0.1, 0);
        //console.log("Mult = ",mult,x.domain().length,width)
        //setting the upper an d lower limit in y - axis
        y.domain([
            d3.min(series[0], function (c) {
                return d3.min(c.data, function (v) {
                    return v.y;
                });
            }) - 4,
            d3.max(series[0], function (c) {
                return d3.max(c.data, function (v) {
                    return v.y;
                });
            }) + 5
        ]);


        y1.domain(
            [
                d3.min(series[1], function (c) {
                    return d3.min(c.data, function (v) {
                        return v.y;
                    });
                }) - 4,
                d3.max(series[1], function (c) {
                    return d3.max(c.data, function (v) {
                        return v.y;
                    });
                }) + 5
            ]
        );

        var tickInterval = parseInt(x.domain().length / 10);
        var ticks = x.domain().filter(function (d, i) {
            return !(i % tickInterval);
        });


        xAxis.tickValues(ticks);
        yAxis.innerTickSize(-width);




        //Appending x - axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("x", (width / 2))
            .attr("y", 35)
            .style("text-anchor", "middle")
            .attr("class","axis-label")
            .text(obj.xAxis&&obj.xAxis.title.text?obj.xAxis.title.text:"");


        //Appending y - axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-3.71em")
            .attr("dx", -((height)/2)-margin.top)
            .style("text-anchor", "middle")
            .attr("class","axis-label")
            .text(obj.yAxis&&obj.xAxis.title.text?obj.xAxis.title.text:"");


        //Appending line in chart
        svg.selectAll(".city")
            .data(series[1])
            .enter().append("g")
            .attr("class", "city")
            .append("path")
            .attr("class", "line")
            .attr("d", function (d) {
                return line(d.data);
            })
            .attr("data-legend", function (d) {
                return d.label
            })
            .style("stroke", function (d) {
                return color(d.label);
            })
            .classed("line-hover", false);


        //selecting all the paths
        var path = svg.selectAll("path");

        //For each line appending the circle at each point
        [series[1]].forEach(function (data) {
            var visibility = "visible";
            //if the length of the
            if (data.data.length > 270) {
                visibility = "hidden";
            }
            svg.selectAll("dot")
                .data(data.data)
                .enter().append("circle")
                .attr('class', 'clips')
                .attr('id', function (d) {
                    return parseInt(x(d.date))
                })
                .style('visibility', visibility)
                .attr("r", 3)
                .style('fill', color(data.label))
                .attr("cx", function (d) {
                    return x(d.date);
                })
                .attr("cy", function (d) {
                    console.log(y1(d.y))
                    return y1(d.y);
                });

        });

        //Hover functionality
        d3.selectAll(obj.divId).on('mousemove', function () {
            var cord = d3.mouse(this);
            nvtooltip.cleanup()

            if (HoverFlag) {
                mouseMoveHide = 'visible'
            } else {
                mouseMoveHide = 'hidden'

            }

            if (cord[1] < 2*margin.top || cord[1] > height || series.length==0 || series[0].data.length==0) {
                return
            }

            d3.selectAll(obj.divId+' > svg > g > circle[class="clips"]')
                .attr('r', dataLength > 200 ? 0 : 3);
            var flag = true;
            var xpos = parseInt(cord[0] - margin.left);
            while (d3.selectAll(obj.divId+" > svg > g > circle[id='" + (xpos) + "']")[0].length == 0) {
                if (flag) {
                    xpos++
                } else {
                    xpos--;
                    if(xpos<0)
                    {
                        break;
                    }
                }
                if (xpos >= width && flag) {
                    flag = false;
                }
            }

            var hover = d3.selectAll(obj.divId+" > svg > g > circle[id='" + xpos + "']")
                .attr('r', 6)
                .style('visibility', mouseMoveHide);
            var data = hover.data();
            var legends = series.map(function (d) {
                return d.label;
            });
            nvtooltip.show(obj.divId,[cord[0], cord[1]], obj.tooltip.formatter(data,legends),'n');

        })
            .on('mouseout', function () {
                nvtooltip.cleanup()
                var radius;
                if (dataLength > 200) {
                    radius = 0
                } else {
                    radius = 3
                }
                d3.selectAll(obj.divId+' > svg > g > circle[class="clips"]')
                    .attr('r', radius)
                    .style('visibility', 'visible');
            });


        //zoming function
        d3.selectAll(obj.divId)
            .on("mousedown", function () {


                //remove all the rectangele created before
                d3.selectAll(obj.divId+" > rect[class='zoom']").remove();

                //assign this toe,
                var e = this,
                    origin = d3.mouse(e),   // origin is the array containing the location of cursor from where the rectangle is created
                    rect = svg.append("rect").attr("class", "zoom"); //apending the rectangle to the chart
                d3.select("body").classed("noselect", true);  //disable select
                //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                origin[0] = Math.max(0, Math.min(width, (origin[0] - margin.left)));
                HoverFlag = false;


                if (origin[1] < 2*margin.top || origin[1] > height|| series.length==0) {
                    HoverFlag = true;
                    return
                }
                //if the mouse is down and mouse is moved than start creating the rectangle
                d3.select(window)
                    .on("mousemove.zoomRect", function () {
                        //current location of mouse
                        var m = d3.mouse(e);
                        //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                        m[0] = Math.max(0, Math.min(width, (m[0] - margin.left)));

                        //asign width and height to the rectangle
                        rect.attr("x", Math.min(origin[0], m[0]))
                            .attr("y", margin.top)
                            .attr("width", Math.abs(m[0] - origin[0]))
                            .attr("height", height-margin.top);
                    })
                    .on("mouseup.zoomRect", function () {  //function to run mouse is released

                        d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);

                        //allow selection
                        d3.select("body").classed("noselect", false);
                        var m = d3.mouse(e);

                        //the position where the mouse the released
                        m[0] = Math.max(0, Math.min(width, (m[0] - margin.left)));
                        //check that the origin location on x axis of the mouse should not be eqaul to last
                        if (m[0] !== origin[0]&&series.length!=0) {

                            //starting filtering data
                            cities.forEach(function (d) {

                                //slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
                                if (d.data.length > 50) {
                                    d.data = d.data.filter(function (a) {
                                        if (m[0] < origin[0]) {
                                            return x(a.date) >= m[0] && x(a.date) <= origin[0];
                                        } else {
                                            return x(a.date) <= m[0] && x(a.date) >= origin[0];
                                        }
                                    });
                                }
                            });
                            zoom = false
                            //calling the chart function to update the graph
                            chart.plot();
                        }
                        HoverFlag = true;
                        rect.remove();
                    }, true);
                d3.event.stopPropagation();
            });


        //When in mouse is over the line than focus the line
        path.on('mouseover', function (d) {
            d.hover = true;
            hover()
        });

        //When in mouse is put the line than focus the line
        path.on('mouseout', function (d) {
            d.hover = false;
            hover()
        });

        //on legend mouse over highlight the respective line
        legend.dispatch.on('legendMouseover', function (d) {
            d.hover = true;
            hover()
        });

        //on legend mouse out set the line to normal
        legend.dispatch.on('legendMouseout', function (d) {
            d.hover = false;
            hover()
        });


        //on legend click toggle line
        legend.dispatch.on('legendClick', function (d) {
            d.disabled = !d.disabled;
            console.log(cities)
            chart.plot();
        });



        function hover() {
            svg.selectAll("path").classed("line-hover", function (d) {
                return d.hover
            })
        }

    };

    chart.plot();

    var initialWidth = $(obj.divId).width();
    setTimeout(function () {
        if ($(obj.divId).width() != initialWidth) {
            console.log("resizing")
            width = $(obj.divId).width() -margin.left - margin.right;
            chart.plot()
        }
    }, 2000);

    window.addEventListener('resize', function () {
        if(width==($(obj.divId).width() -margin.left - margin.right)) {
            console.log("width same")
        }
        else {
            width = $(obj.divId).width() -margin.left - margin.right;
            chart.plot();

        }
    });

    d3.select(obj.divId).on('click',function () {
        chart.plot()
    });


    chart.height = function (newHeight) {
        if(newHeight!=height) {
            height = newHeight;
            chart.plot();
        }
    };

    chart.margin = function (_) {
        if(_) {
            margin = _;
            chart.plot();
        }
    };
    return chart;


}

