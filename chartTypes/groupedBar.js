/**
 * Created by vidit on 6/10/16.
 */
function d3GroupedBar(obj) {

    var numberOfTicks = 10;

    var chart = {};

    var data = obj.data;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom: 60, left: 50},
        width = $(obj.divId).width() - margin.left - margin.right,
        height = obj.height ? obj.height : 550 - margin.top - margin.bottom;

    //Parse date function
    var parseDate = d3.time.format("%Y%m%d").parse;

    var color = d3.scale.category10();

    var y = d3.scale.linear().range([height, margin.top]);


    var x0 = d3.scale.ordinal()
        .rangeBands([0, width], .2);

    var x1 = d3.scale.ordinal()
        .rangeBands([0, x0.rangeBand()], .5);

    var xAxis = d3.svg.axis()
        .scale(x0)
        .orient("bottom")
        .tickFormat(function (d) {
            return moment(d).format("YYYY-MM-DD")
        });

    var yAxis = d3.svg.axis()
        .scale(y)
        .innerTickSize(-width)
        .orient("left");

    var mouseMoveHide = 'visible',
        HoverFlag = true;

    //calling legend and setting width,height,margin,color
    var legend = d3Legend().height(height + margin.top + margin.bottom).width(width).margin(margin).color(color);

    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "date";
    }));

    var cities = color.domain().map(function (c) {
        return data.map(function (d) {
            return {x: d.date, y: +d[c]};
        });
    });

    for (var i = 0; i < cities.length; i++) {
        var cityCopyObj = {};
        cityCopyObj.data = cities[i];
        cityCopyObj.label = color.domain()[i];
        cityCopyObj.hover = false;
        cityCopyObj.disabled = true;
        cities[i] = cityCopyObj
    }

    var rawData = JSON.parse(JSON.stringify(cities))
    var series, dataLength, zoom = true;


    //HammerJs functionality added
    var div = document.getElementById(obj.divId.indexOf("#") == -1 ? obj.divId : obj.divId.replace("#", ""));

    var mc = new Hammer.Manager(div);
    var pinch = new Hammer.Pinch();
    var pan = new Hammer.Pan();
    var tap = new Hammer.Tap();
    var pinchFlag = false, startPointsPinch, endPointsPinch, startLocation = 0, panStart, panEnd;
    pinch.recognizeWith(pan);

    mc.add([pinch, pan, tap]);
    if (window.innerWidth < 768) {

        mc.on("panstart", function (ev) {
            if (pinchFlag == false) {
                panStart = ev.center;
            }

        });

        mc.on("panend", function (ev) {
            if (pinchFlag == false) {
                panEnd = ev.center;
                var pointsX = [parseInt(parseInt(panStart.x) / (width / x0.domain().length)), parseInt(parseInt(panEnd.x) / (width / x0.domain().length))]
                var startLength = pointsX[0] - pointsX[1];
                console.log("points", pointsX)
                console.log("starLength=", startLength);
                console.log("start location old", startLocation);
                console.log(startLocation + startLength + cities[0].data.length)
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
                console.log("start location updated", startLocation);
                cities.forEach(function (d, i) {
                    var dataLength = (startLocation + d.data.length) < rawData[i].data.length ? (startLocation + d.data.length) : rawData[i].data.length;
                    console.log("Data length", dataLength);
                    d.data = rawData[i].data.slice(startLocation, dataLength);
                });
                chart.plot();
            }

        });

        mc.on("pinchstart", function (ev) {
            pinchFlag = true;
            console.log("pinch start");
            startPointsPinch = ev.pointers;

        });

        mc.on("pinchend", function (ev) {
            console.log("pinchend");
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
            console.log("Chart Name", obj.divId);
            console.log("Change index first point", parseInt(parseInt(xPinch[0][0]) / (width / x.domain().length)), "-->", parseInt(parseInt(xPinch[1][0]) / (width / x.domain().length)));
            console.log("Change index second point", parseInt(parseInt(xPinch[0][1]) / (width / x.domain().length)), "-->", parseInt(parseInt(xPinch[1][1]) / (width / x.domain().length)));
            console.log("trigger = ",
                (parseInt(parseInt(xPinch[0][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[0][0]) / (width / x.domain().length)))
                <
                (parseInt(parseInt(xPinch[1][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[1][0]) / (width / x.domain().length))) ? "Zoom IN" : "Zoom OUT");

            var startLength = (parseInt(parseInt(xPinch[0][0]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[1][0]) / (width / x.domain().length)));
            var endLength = (parseInt(parseInt(xPinch[1][1]) / (width / x.domain().length)) - parseInt(parseInt(xPinch[0][1]) / (width / x.domain().length)));
            console.log("points to be shifted from front", startLength);
            console.log("points to be shifted from end", endLength);
            if ((startLocation + startLength) < 0) {
                startLength = startLength - (startLength + startLocation);
            }
            startLocation = (startLocation + startLength) < 0 ? 0 : (startLocation + startLength);
            //starting filtering data
            var loopingVariable = true;
            cities.forEach(function (d, i) {
                if (loopingVariable == false)
                    return;
                //slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
                if (startLength > 0 && endLength > 0) {
                    console.log("pure zoom in");
                    if (d.data.length > 10) {
                        d.data = d.data.splice(startLength, d.data.length - endLength);
                    } else {
                        console.log("no change");
                        console.log(startLocation, startLength);
                        startLocation = startLocation - startLength;
                        loopingVariable = false;
                    }
                }
                else {
                    console.log("Pure zoom out");
                    var dataLength = ((-startLength + d.data.length - endLength) > rawData[i].data.length ? rawData[i].data.length : (-startLength + d.data.length - endLength));
                    dataLength = (startLocation + dataLength - 1) >= rawData[i].data.length ? (rawData[i].data.length - startLocation - 1) : (dataLength - 1);
                    d.data = rawData[i].data.slice(startLocation, startLocation + dataLength);
                }
            });
            console.log("starting index in original data=", startLocation, cities[0].data[0]);
            // rawData[0].data.forEach(function (d, i) {
            //     if (moment(d.date).format("YYYY-MM-DD") == moment(cities[0].data[0].date).format("YYYY-MM-DD")) {
            //         console.log("checking data", i);
            //     }
            // });
            chart.plot();

            setTimeout(function () {
                pinchFlag = false;
            }, 500)
        });
    }

    chart.plot = function () {



        //Empty the container before loading
        d3.selectAll(obj.divId+" > *").remove();


        var svg = d3.select(obj.divId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        series = cities.filter(function (d) {
            return d.disabled;
        });

        //Appending legend box
        svg.append('g')
            .attr('class', 'legendWrap');

        //legend location
        svg.select('.legendWrap').datum(cities)
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            .call(legend);


        //Chart Title
        svg.append('g').attr('class', 'titleWrap').append('text')
            .attr("x", (width / 2))
            .attr("y", (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(obj.title);

        //Reset Zoom Button
        svg.append('g').attr('class', 'resetZoom')
            .classed("toggleReset", zoom)
            .attr("x", 10)
            .attr("y", 10)
            .style("z-index", 1000)
            .append("rect")  //Appending rectangle styling
            .attr("width", 100)
            .attr("height", 25)
            .attr("rx", 2)
            .style("fill", "#f2f2f2")
            .style("stroke", "#666666")
            .style("stroke-width", "1px");

        d3.select(obj.divId+" > svg > g > g[class='resetZoom']") //Adding reset zoom text to the reset zoom rectangle
            .append("text")
            .attr("x", 10 + 40)
            .attr("y", 10 + 6)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Reset Zoom");


        //Click on reset zoom function
        d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown", function () {
            console.log("reset triggered");
            cities.forEach(function (d, i) {
                d.data = rawData[i].data;
                console.log(d);
            });
            console.log(cities);
            zoom = true;
            chart.plot()

        });

        //check if the data is present or not
        if (series.length == 0 || series[0].data.length == 0) {
            //Chart Title
            svg.append('g').attr('class', 'noDataWrap').append('text')
                .attr("x", (width / 2))
                .attr("y", (height / 2))
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .text("No data to display");
            return;
        }

        y.domain([0,
            d3.max(series, function (c) {
                return d3.max(c.data, function (v) {
                    return (v.y);
                });
            })]).nice();

        x0.domain(series[0].data.map(function (d) {
            return d.x;
        }));

        x0.rangeBands([0, width], 0.1, 0);
        var tickInterval = parseInt(x0.domain().length / numberOfTicks);


        var ticks = x0.domain().filter(function (d, i) {
            return !(i % tickInterval);
        });

        xAxis.tickValues(ticks);

        x1.domain(color.domain()).rangeBands([0, x0.rangeBand()]);


        //Appending y - axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-3.71em")
            .attr("dx", -((height) / 2) - margin.top)
            .style("text-anchor", "middle")
            .attr("class", "axis-label")
            .text(obj.yAxis && obj.yAxis.label ? obj.yAxis.label : "");

        //Appending x - axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("x", (width / 2))
            .attr("y", 35)
            .style("text-anchor", "middle")
            .attr("class", "axis-label")
            .text(obj.xAxis && obj.xAxis.label ? obj.xAxis.label : "");


        svg.append("g").selectAll("g")
            .data(series)
            .enter().append("g")
            .style("fill", function (d, i) {
                return color(d.label);
            })
            .attr("transform", function (d, i) {
                return "translate(" + x1(d.label) + ",0)";
            })
            .selectAll("rect")
            .data(function (d) {
                return d.data;
            })
            .enter().append("rect")
            .attr("width", x1.rangeBand())
            .attr("height", function (d) {
                return height - y(d.y)
            })
            .attr("x", function (d, i) {
                return x0(d.x);
            })
            .attr("y", function (d) {
                return y(d.y);
            });

        var rectangle = svg.selectAll('rect')

        //mouse over function
        rectangle
            .on('mouseover', function (d) {
                nvtooltip.cleanup();
                var cord = d3.mouse(this);
                if (cord[1] <  2*margin.top || cord[1] > height || series.length == 0 || series[0].data.length == 0) {
                    return
                }
                nvtooltip.show(obj.divId,[x0(d.x) + margin.left + x0.rangeBand() / 2, cord[1]], '<h3>' + moment(d.x).format("YYYY-MM-DD") + '</h3>');
            })
            .on('mouseout', function (d) {
                nvtooltip.cleanup();
            });


        //zoming function
        d3.selectAll(obj.divId)
            .on("mousedown", function (d) {
                //remove all the rectangele created before
                d3.selectAll(obj.divId + " > rect[class='zoom']").remove();
                //assign this toe,
                var e = this,
                    origin = d3.mouse(e),   // origin is the array containing the location of cursor from where the rectangle is created
                    rectSelected = svg.append("rect").attr("class", "zoom"); //apending the rectangle to the chart
                d3.select("body").classed("noselect", true);  //disable select
                //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                origin[0] = Math.max(0, Math.min(width, (origin[0])));
                HoverFlag = false;

                if (origin[1] < 2 * margin.top  || origin[1] > height || series.length == 0) {
                    HoverFlag = true;
                    return
                }

                //if the mouse is down and mouse is moved than start creating the rectangle
                d3.selectAll(obj.divId)
                    .on("mousemove.zoomRect", function (d) {

                        //current location of mouse
                        var m = d3.mouse(e);
                        //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                        m[0] = Math.max(0, Math.max(margin.left, Math.min(width + margin.left, (m[0]))));

                        //asign width and height to the rectangle
                        rectSelected.attr("x", Math.min(origin[0], m[0]))
                            .attr("y", (margin.top))
                            .attr("width", Math.abs(m[0] - origin[0]))
                            .attr("height", height-margin.top);
                    })
                    .on("mouseup.zoomRect", function (d) {  //function to run mouse is released

                        //stop above event listner
                        d3.select(obj.divId).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);

                        //allow selection
                        d3.select("body").classed("noselect", false);
                        var m = d3.mouse(e);

                        //the position where the mouse the released
                        m[0] = Math.max(0, Math.min(width, (m[0])));

                        //check that the origin location on x axis of the mouse should not be eqaul to last
                        if (m[0] !== origin[0] && series[0].data.length > 20) {

                            cities.forEach(function (d) {

                                //slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
                                if (d.data.length > 10) {
                                    d.data = d.data.filter(function (a) {
                                        if (m[0] < origin[0]) {
                                            return x0(a.x) >= m[0] && x0(a.x) <= origin[0];
                                        } else {
                                            return x0(a.x) <= m[0] && x0(a.x) >= origin[0];
                                        }
                                    });
                                }
                            });
                            zoom = false;
                            chart.plot();
                        }
                        HoverFlag = true;
                        rectSelected.remove();

                    }, true);
                d3.event.stopPropagation();
            });


        //on legend click toggle line
        legend.dispatch.on('legendClick', function (d) {
            d.disabled = !d.disabled;
            chart.plot();
        });
    };

    chart.plot();
    window.addEventListener('resize', function () {
        width = $(obj.divId).width() - margin.left - margin.right;
        chart.plot();
    });

    chart.height = function (newHeight) {
        if (newHeight != height) {
            height = newHeight;
            chart.plot();
        }
    };

    chart.margin = function (_) {
        if (_) {
            margin = _;
            chart.plot();
        }
    };
    return chart;
}