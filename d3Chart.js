/**
 * Created by vidit on 6/13/16.
 */

(function($) {

    var nvtooltip = window.nvtooltip = {};

    nvtooltip.show = function(div,pos, content, gravity, dist) {
        var container = $('<div class="nvtooltip">');

        gravity = gravity || 's';
        dist = dist || 20;

        container
            .html(content)
            .css({left: -1000, top: -1000, opacity: 0})
            .appendTo(div);

        var height = container.height() + parseInt(container.css('padding-top'))  + parseInt(container.css('padding-bottom')),
            width = container.width() + parseInt(container.css('padding-left'))  + parseInt(container.css('padding-right')),
            windowWidth = $(window).width(),
            windowHeight = $(window).height(),
            scrollTop = $('body').scrollTop(),  //TODO: also adjust horizontal scroll
            left, top;


        //TODO: implement other gravities
        switch (gravity) {
            case 'e':
            case 'w':
            case 'n':
                left = pos[0] - (width / 2) + $(div).offset().left;
                top = pos[1] + dist +$(div).offset().top;
                if (left < 0) left = 5;
                if (left + width > windowWidth) left = windowWidth - width - 5;
                if (scrollTop + windowHeight < top + height) top = pos[1] - height - dist;
                break;
            case 's':
                left = pos[0] - (width / 2)+ $(div).offset().left;
                top = pos[1] - height - dist+$(div).offset().top;
                if (left < 0) left = 5;
                if (left + width > windowWidth) left = windowWidth - width - 5;
                if (scrollTop > top) top = pos[1] + dist;
                break;
        }

        container
            .css({
                left: left,
                top: top,
                opacity: 1
            });
    };

    nvtooltip.cleanup = function() {
        var tooltips = $('.nvtooltip');

        // remove right away, but delay the show with css
        tooltips.css({
            'transition-delay': '0 !important',
            '-moz-transition-delay': '0 !important',
            '-webkit-transition-delay': '0 !important'
        });

        tooltips.css('opacity',0);

        setTimeout(function() {
            tooltips.remove()
        }, 200);
    };

})(jQuery);


function d3Legend() {
    var margin = {top: 20, right: 80, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        color = d3.scale.category10().range(),
        dispatch = d3.dispatch('legendClick', 'legendMouseover', 'legendMouseout');


    function chart(selection) {
        selection.each(function(data) {
            /**
             *    Legend curently is setup to automaticaly expand vertically based on a max width.
             *    Should implement legend where EITHER a maxWidth or a maxHeight is defined, then
             *    the other dimension will automatically expand to fit, and anything that exceeds
             *    that will automatically be clipped.
             **/

            var wrap = d3.select(this).selectAll('g.legend').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'legend').append('g');


            var g = wrap.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


            var series = g.selectAll('.series')
                .data(function(d) { return d });
            var seriesEnter = series.enter().append('g').attr('class', 'series')
                .on('click', function(d, i) {
                    dispatch.legendClick(d, i);
                })
                .on('mouseover', function(d, i) {
                    dispatch.legendMouseover(d, i);
                })
                .on('mouseout', function(d, i) {
                    dispatch.legendMouseout(d, i);
                });

            //set the color of the circle before the legend name
            seriesEnter.append('circle')
                .style('fill', function(d, i){ return d.color || color(d.label)})
                .style('stroke', function(d, i){ return d.color || color(d.label) })
                .attr('r', 7);

            //setting text of the legend
            seriesEnter.append('text')
                .text(function(d) { return d.label })
                .attr('text-anchor', 'start')
                .attr('dy', '.32em')
                .attr('dx', '12')
                .attr('font-size','15');
            series.classed('disabled', function(d) { return d.disabled });
            series.exit().remove();

            var ypos = 5,
                newxpos = 5,
                maxwidth = 0,
                xpos;
            series
                .attr('transform', function(d, i) {
                    var length = d3.select(this).select('text').node().getComputedTextLength() + 28;
                    xpos = newxpos;

                    //TODO: 1) Make sure dot + text of every series fits horizontally, or clip text to fix
                    //TODO: 2) Consider making columns in line so dots line up
                    //         --all labels same width? or just all in the same column?
                    //         --optional, or forced always?
                    if (width < margin.left + margin.right + xpos + length) {
                        newxpos = xpos = 5;
                        ypos += 20;
                    }

                    newxpos += length;
                    if (newxpos > maxwidth) maxwidth = newxpos;

                    return 'translate(' + xpos + ',' + ypos + ')';
                });

            //position legend as far right as possible within the total width
            g.attr('transform', 'translate(' + 0 + ',' + (height-margin.top-margin.bottom/2+8) + ')');

        });

        return chart;
    }

    chart.dispatch = dispatch;

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.color = function(_) {
        if (!arguments.length) return color;
        color = _;
        return chart;
    };
    function heightCalculate(margin) {
        var h = $(window).height() - 100;

        return ( h - margin.top - margin.bottom - 20 < 0 ) ?
        margin.top + margin.bottom + 2 : h;
    }

    return chart;

}


function d3Area(obj) {
    var chart = {};

    var data = obj.data;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom: 60, left: 50},
        width = $(obj.divId).width() - margin.left - margin.right,
        height = obj.height ? obj.height : 550 - margin.top - margin.bottom;

    //Parse date function
    var parseDate = d3.time.format("%Y%m%d").parse;

    //x
    var x = d3.scale.ordinal()
        .domain([0, 1])
        .rangePoints([0, width], 0.1, 0);

    //y
    var y = d3.scale.linear().range([height, margin.top]);

    var color = d3.scale.category10();

    // Defining xAxis location at bottom the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function (d) {
            return moment(d).format("YYYY-MM-DD")
        });

    //Defining yAxis location at left the axes
    var yAxis = d3.svg.axis()
        .scale(y)
        .innerTickSize(-width)

        .orient("left");

    //graph type line and
    var line = d3.svg.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.y);
        });


    var count = 0;
    var stack = d3.layout.stack()
        .offset("zero")
        .values(function (d) {
            return d.data;
        })
        .x(function (d) {
            return x(d.date)
        })
        .y(function (d) {
            return d.y;
        });

    var area = d3.svg.area()
        .x(function (d) {
            return x(d.date)
        })
        .y0(function (d) {
            return y(d.y0)
        })
        .y1(function (d) {
            return y(d.y0 + d.y);
        });

    var mouseMoveHide = 'visible',
        HoverFlag = true;

    //calling legend and setting width,height,margin,color
    var legend = d3Legend().height(height + margin.top + margin.bottom).width(width).margin(margin).color(color);


    //Setting domain for the colors with te exceptioon of date column
    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "date";
    }));



    //Formatting data and assigning to cities variable
    var cities = color.domain().map(function (name) {
        return {
            label: name,
            data: data.map(function (d) {
                return {date: d.date, y: +d[name]};
            }),
            hover: false,
            disabled: true

        };
    });
    var rawData = JSON.parse(JSON.stringify(cities))
    var series, dataLength, zoom = true;

    //HammerJs functionality added
    var div = document.getElementById(obj.divId.indexOf("#")==-1?obj.divId:obj.divId.replace("#",""));
    var mc = new Hammer.Manager(div);
    var pinch = new Hammer.Pinch();
    var pan = new Hammer.Pan();
    var tap = new Hammer.Tap();
    var pinchFlag = false,startPointsPinch,endPointsPinch,startLocation = 0,panStart,panEnd;
    pinch.recognizeWith(pan);

    mc.add([pinch, pan,tap]);
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
            //         return;
            //     }
            // });
            chart.plot();

            setTimeout(function () {
                pinchFlag = false;
            }, 500)
        });


    }


    //Update function to create chart
    chart.plot = function () {
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
            .text(obj.title);

        //Reset Zoom Button
        svg.append('g').attr('class','resetZoom')
            .classed("toggleReset",zoom)
            .attr("x", 10)
            .attr("y",  10)
            .style("z-index",1000)
            .append("rect")  //Appending rectangle styling
            .attr("width",100)
            .attr("height",25)
            .attr("rx",2)
            .style("fill","#f2f2f2")
            .style("stroke","#666666")
            .style("stroke-width","1px");

        d3.select(obj.divId+" > svg > g > g[class='resetZoom']") //Adding reset zoom text to the reset zoom rectangle
            .append("text")
            .attr("x",10+40)
            .attr("y",10+6)
            .attr("text-anchor", "middle")
            .style("font-size","12px")
            .text("Reset Zoom");


        //Click on reset zoom function
        d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown",function () {
            console.log("reset triggered");
            cities.forEach(function (d,i) {
                d.data = rawData[i].data;
                console.log(d);
            });
            console.log(cities);
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


        stack(series);


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
            d3.min(series, function(c) { return d3.min(c.data, function(v) { return v.y0; }); }),
            d3.max(series, function(c) { return d3.max(c.data, function(v) { return v.y0+ v.y; }); })+4
        ]);


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
            .text(obj.xAxis&&obj.xAxis.label?obj.xAxis.label:"");

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
            .text(obj.yAxis&&obj.yAxis.label?obj.yAxis.label:"");


        //Appending line in chart
        svg.selectAll(".city")
            .data(series)
            .enter().append("g")
            .attr("class", "city")
            .append("path")
            .attr("class", "streamPath")
            .attr("d", function (d) {
                return area(d.data);
            })
            .attr("data-legend", function (d) {
                return d.label
            })
            .style("fill", function (d) {
                return color(d.label);
            })
            .style("stroke-width", "2px")
            .style("stroke", "#333333")
            .classed("line-hover", false);


        //selecting all the paths
        var path = svg.selectAll("path");

        //For each line appending the circle at each point
        series.forEach(function (data) {
            var visibility = "visible";
//                if the length of the
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
                .attr("r", 4)
                .style('fill', color(data.label))
                .style('stroke', '#333333')
                .attr("cx", function (d) {
                    return x(d.date);
                })
                .attr("cy", function (d) {
                    return y(d.y + d.y0);
                });

        });
//
//
        //Hover functionality
        d3.selectAll(obj.divId).on('mousemove', function () {
            nvtooltip.cleanup();
            var cord = d3.mouse(this);


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
            nvtooltip.show(obj.divId,[cord[0], cord[1]], '<h3>' + moment(data[0].date).format("YYYY-MM-DD") + '</h3>');

        })
            .on('mouseout', function () {
                nvtooltip.cleanup();
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
                console.log(origin)
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
                        console.log("zooming rectangle changing")
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

                        //stop above event listner
                        d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);

                        //allow selection
                        d3.select("body").classed("noselect", false);
                        var m = d3.mouse(e);

                        //the position where the mouse the released
                        m[0] = Math.max(0, Math.min(width, (m[0] - margin.left)));
                        console.log("zooming complete");
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
                            //calling the update function to update the graph
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
            chart.plot();
        });


        function hover() {
            d3.selectAll("path").classed("line-hover", function (d) {
                return d.hover
            })
        }
    }

    chart.plot();

    window.addEventListener('resize', function () {
        width = $(obj.divId).width() - margin.left - margin.right;
        chart.plot();
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

function d3Line(obj) {

    var chart = {};

    var data = obj.data;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom: 90, left: 50},

        width = $(obj.divId).width() - margin.left - margin.right,
        height = obj.height?obj.height:550 - margin.top - margin.bottom;

    //Parse date function



    //x
    var x = d3.scale.ordinal()
        .domain([0, 1])
        .rangePoints([0, width], 0.1, 0);
    //y
    var y = d3.scale.linear().range([height, margin.top]);

    var color = d3.scale.category10();

    // Defining xAxis location at bottom the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function(d){
            return moment(d).format("YYYY-MM-DD")
        });
    //Defining yAxis location at left the axes
    var yAxis = d3.svg.axis()
        .scale(y)
        .innerTickSize(-width)

        .orient("left");

    //graph type line and
    var line = d3.svg.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.y);
        });


    //calling legend and setting width,height,margin,color
    var legend = d3Legend().height(height + margin.top + margin.bottom).width(width).margin(margin).color(color);


    var mouseMoveHide = 'visible',
        HoverFlag = true;

    //Setting domain for the colors with te exceptioon of date column
    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "date";
    }));

    //Parsing date in the required format


    //Formatting data and assigning to cities variable
    var cities = color.domain().map(function (name) {
        return {
            label: name,
            data: data.map(function (d) {
                return {date: d.date, y: +d[name]};
            }),
            hover: false,
            disabled: true

        };
    });
    var rawData = JSON.parse(JSON.stringify(cities))
    var series, dataLength,zoom = true;

    console.log(rawData)

    //HammerJs functionality added
    var div = document.getElementById(obj.divId.indexOf("#")==-1?obj.divId:obj.divId.replace("#",""));
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
                chart.plot()
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
//                slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
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
            //         return;
            //     }
            // });
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
            .text(obj.title);





        //Reset Zoom Button
        svg.append('g').attr('class','resetZoom')
            .classed("toggleReset",zoom)
            .attr("x", 10)
            .attr("y",  10)
            .style("z-index",1000)
            .append("rect")  //Appending rectangle styling
            .attr("width",100)
            .attr("height",25)
            .attr("rx",2)
            .style("fill","#f2f2f2")
            .style("stroke","#666666")
            .style("stroke-width","1px");

        d3.select(obj.divId+" > svg > g > g[class='resetZoom']") //Adding reset zoom text to the reset zoom rectangle
            .append("text")
            .attr("x",10+40)
            .attr("y",10+6)
            .attr("text-anchor", "middle")
            .style("font-size","12px")
            .text("Reset Zoom");

        //Click on reset zoom function
        d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown",function () {
            console.log("reset triggered");
            cities.forEach(function (d,i) {
                d.data = rawData[i].data;
                console.log(d);
            });
            console.log(cities);
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
            d3.min(series, function (c) {
                return d3.min(c.data, function (v) {
                    return v.y;
                });
            }) - 4,
            d3.max(series, function (c) {
                return d3.max(c.data, function (v) {
                    return v.y;
                });
            }) + 5
        ]);


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
            .text(obj.xAxis&&obj.xAxis.label?obj.xAxis.label:"");


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
            .text(obj.yAxis&&obj.yAxis.label?obj.yAxis.label:"");


        //Appending line in chart
        svg.selectAll(".city")
            .data(series)
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
        series.forEach(function (data) {
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
                    return y(d.y);
                });

        });


        //Hover functionality
        d3.selectAll(obj.divId).on('mousemove', function () {
            nvtooltip.cleanup();
            var cord = d3.mouse(this);


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
            })
            nvtooltip.show(obj.divId,[cord[0], cord[1]], obj.tooltip.formatter(data,legends));

        })
            .on('mouseout', function () {
                nvtooltip.cleanup();
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
        d3.select(obj.divId)
            .on("mousedown", function () {


                //remove all the rectangele created before
                d3.selectAll(obj.divId+" > rect[class='zoom']").remove();

                //assign this toe,
                var e = this,
                    origin = d3.mouse(e),   // origin is the array containing the location of cursor from where the rectangle is created
                    rect = svg.append("rect").attr("class", "zoom"); //apending the rectangle to the chart
                d3.select("body").classed("noselect", true);  //disable select
                console.log(origin)
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
                        console.log("zooming rectangle changing")
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
                        console.log("zooming complete");
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
            chart.plot();
        });


        function hover() {
            d3.selectAll("path").classed("line-hover", function (d) {
                return d.hover
            })
        }


    };

    chart.plot();

    window.addEventListener('resize', function () {
        width = $(obj.divId).width() - margin.left - margin.right;
        chart.plot();
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

function d3Stacked(obj) {

    var chart = {};

    var data = obj.data;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom: 60, left: 50},
        width = $(obj.divId).width() - margin.left - margin.right,
        height = obj.height ? obj.height : 550 - margin.top - margin.bottom;

    //Parse date function
    var parseDate = d3.time.format("%Y%m%d").parse;

    //x
    var x = d3.scale.ordinal()
        .domain([0, 1])
        .rangeBands([0, width], 0.1, 0);

    //y
    var y = d3.scale.linear().range([height, margin.top]);

    var color = d3.scale.category10();

    // Defining xAxis location at bottom the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function (d) {
            return moment(d).format("YYYY-MM-DD")
        });

    //Defining yAxis location at left the axes
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


    var cities = d3.layout.stack()(color.domain().map(function (c) {
        return data.map(function (d) {
            return {x: d.date, y: +d[c]};
        });
    }));


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
                var pointsX = [parseInt(parseInt(panStart.x) / (width / x.domain().length)), parseInt(parseInt(panEnd.x) / (width / x.domain().length))]
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
            //         return;
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
        d3.selectAll(obj.divId + " > *").remove();

        //Adding chart and placing chart at specific locaion using translate
        var svg = d3.select(obj.divId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("class", "chart")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        //Filtering data if the column is disable or not
        var series = cities.filter(function (d) {
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


        var temp = d3.layout.stack()(series.map(function (c) {
            return c.data.map(function (d) {
                return {x: d.x, y: +d.y};
            })
        }));
        for (var i = 0; i < series.length; i++) {
            series[i].data = temp[i]
        }

        x.domain(series[0].data.map(function (d) {
            return d.x;
        }));
        var mult = Math.max(1, Math.floor(width / x.domain().length));
        x.rangeBands([0, width], 0.1, 0);
        y.domain([
            0,
            d3.max(series, function (c) {
                return d3.max(c.data, function (v) {
                    return v.y0 + v.y;
                });
            }) + 4
        ]).nice();

        var tickInterval = parseInt(x.domain().length / 10);
        var ticks = x.domain().filter(function (d, i) {
            return !(i % tickInterval);
        });
        xAxis.tickValues(ticks);

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

        var layer = svg.selectAll(".layer")
            .data(series)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function (d, i) {
                return color(d.label);
            });

        layer.selectAll("rect")
            .data(function (d) {
                return d.data;
            })
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.x);
            })
            .attr("y", function (d) {
                return y(d.y + d.y0);
            })
            .attr("height", function (d) {
                return y(d.y0) - y(d.y + d.y0);
            })
            .attr("width", x.rangeBand() - 1);


        //selecting all the paths
        var path = svg.selectAll("rect");

        var rectangle = d3.selectAll('rect');

        //mouse over function
        path
            .on('mouseover', function (d) {
                nvtooltip.cleanup();
                var cord = d3.mouse(this);
                if (cord[1] < 2 * margin.top || cord[1] > height || series.length == 0 || series[0].data.length == 0) {
                    return
                }
                nvtooltip.show(obj.divId, [x(d.x) + margin.left + x.rangeBand() / 2, cord[1]], '<h3>' + moment(d.x).format("YYYY-MM-DD") + '</h3>');
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

                if (origin[1] < 2 * margin.top || origin[1] > height || series.length == 0) {
                    HoverFlag = true;
                    return
                }
                //if the mouse is down and mouse is moved than start creating the rectangle
                d3.selectAll(obj.divId)
                    .on("mousemove.zoomRect", function (d) {
                        console.log("zooming rectangle changing")
                        //current location of mouse
                        var m = d3.mouse(e);
                        //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                        m[0] = Math.max(0, Math.max(margin.left, Math.min(width + margin.left, (m[0]))));

                        //asign width and height to the rectangle
                        rectSelected.attr("x", Math.min(origin[0], m[0]))
                            .attr("y", margin.top)
                            .attr("width", Math.abs(m[0] - origin[0]))
                            .attr("height", height - margin.top);
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
                                            return x(a.x) >= m[0] && x(a.x) <= origin[0];
                                        } else {
                                            return x(a.x) <= m[0] && x(a.x) >= origin[0];
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
    }


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

function d3Scattered(obj) {

    var chart = {};

    var data = obj.data;

    //Setting margin and width and height
    var margin = {top: 20, right: 30, bottom: 90, left: 50},

        width = $(obj.divId).width() - margin.left - margin.right,
        height = obj.height?obj.height:550 - margin.top - margin.bottom;

    //Parse date function
    var parseDate = d3.time.format("%Y%m%d").parse;


    //x
    var x = d3.scale.ordinal()
        .domain([0, 1])
        .rangePoints([0, width], 0.1, 0);
    //y
    var y = d3.scale.linear().range([height, margin.top]);

    var color = d3.scale.category10();

    // Defining xAxis location at bottom the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function(d){
            return moment(d).format("YYYY-MM-DD")
        });
    //Defining yAxis location at left the axes
    var yAxis = d3.svg.axis()
        .scale(y)
        .innerTickSize(-width)

        .orient("left");

    //graph type line and
    var line = d3.svg.line()
        .x(function (d) {
            return x(d.date);
        })
        .y(function (d) {
            return y(d.y);
        });


    //calling legend and setting width,height,margin,color
    var legend = d3Legend().height(height + margin.top + margin.bottom).width(width).margin(margin).color(color);


    var mouseMoveHide = 'visible',
        HoverFlag = true;

    //Setting domain for the colors with te exceptioon of date column
    color.domain(d3.keys(data[0]).filter(function (key) {
        return key !== "date";
    }));


    //Formatting data and assigning to cities variable
    var cities = color.domain().map(function (name) {
        return {
            label: name,
            data: data.map(function (d) {
                return {date: d.date, y: +d[name]};
            }),
            hover: false,
            disabled: true

        };
    });
    var rawData = JSON.parse(JSON.stringify(cities))
    var series, dataLength,zoom = true;

    //HammerJs functionality added
    var div = document.getElementById(obj.divId.indexOf("#")==-1?obj.divId:obj.divId.replace("#",""));
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

    if (window.innerWidth < 768) {
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
//                slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
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
            //         return;
            //     }
            // });
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
            .text(obj.title);





        //Reset Zoom Button
        svg.append('g').attr('class','resetZoom')
            .classed("toggleReset",zoom)
            .attr("x", 10)
            .attr("y", -20)
            .style("z-index",1000)
            .append("rect")  //Appending rectangle styling
            .attr("width",100)
            .attr("height",25)
            .attr("rx",2)
            .style("fill","#f2f2f2")
            .style("stroke","#666666")
            .style("stroke-width","1px");

        d3.select(obj.divId+" > svg > g > g[class='resetZoom']") //Adding reset zoom text to the reset zoom rectangle
            .append("text")
            .attr("x",10+40)
            .attr("y",10+6)
            .attr("text-anchor", "middle")
            .style("font-size","12px")
            .text("Reset Zoom");

        //Click on reset zoom function
        d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown",function () {
            console.log("reset triggered");
            cities.forEach(function (d,i) {
                d.data = rawData[i].data;
                console.log(d);
            });
            console.log(cities);
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
            d3.min(series, function (c) {
                return d3.min(c.data, function (v) {
                    return v.y;
                });
            }) - 4,
            d3.max(series, function (c) {
                return d3.max(c.data, function (v) {
                    return v.y;
                });
            }) + 5
        ]);


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
            .text(obj.xAxis&&obj.xAxis.label?obj.xAxis.label:"");


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
            .text(obj.yAxis&&obj.yAxis.label?obj.yAxis.label:"");





        //selecting all the paths
        var path = svg.selectAll("path");

        //For each line appending the circle at each point
        series.forEach(function (data) {
            svg.selectAll("dot")
                .data(data.data)
                .enter().append("circle")
                .attr('class', 'clips')
                .attr('id', function (d) {
                    return parseInt(x(d.date))
                })
                .attr("r", 3)
                .style('fill', color(data.label))
                .attr("cx", function (d) {
                    return x(d.date);
                })
                .attr("cy", function (d) {
                    return y(d.y);
                });

        });


        //Hover functionality
        d3.selectAll(obj.divId).on('mousemove', function () {
            nvtooltip.cleanup();
            var cord = d3.mouse(this);


            if (HoverFlag) {
                mouseMoveHide = 'visible'
            } else {
                mouseMoveHide = 'hidden'

            }

            if (cord[1] < 2*margin.top || cord[1] > height || series.length==0 || series[0].data.length==0) {
                return
            }

            d3.selectAll(obj.divId+' > svg > g > circle[class="clips"]')
                .attr('r',  3);
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
            nvtooltip.show(obj.divId,[cord[0], cord[1]], '<h3>' + moment(data[0].date).format("YYYY-MM-DD") + '</h3>');

        })
            .on('mouseout', function () {
                nvtooltip.cleanup();
                d3.selectAll(obj.divId+' > svg > g > circle[class="clips"]')
                    .attr('r', 3)
            });


        //zoming function
        d3.select(obj.divId)
            .on("mousedown", function () {


                //remove all the rectangele created before
                d3.selectAll(obj.divId+" > rect[class='zoom']").remove();

                //assign this toe,
                var e = this,
                    origin = d3.mouse(e),   // origin is the array containing the location of cursor from where the rectangle is created
                    rect = svg.append("rect").attr("class", "zoom"); //apending the rectangle to the chart
                d3.select("body").classed("noselect", true);  //disable select
                console.log(origin)
                //find the min between the width and and cursor location to prevent the rectangle move out of the chart
                origin[0] = Math.max(0, Math.min(width, (origin[0] - margin.left)));
                HoverFlag = false;


                if (origin[1] < margin.top+10 || origin[1] > height|| series.length==0) {
                    HoverFlag = true;
                    return
                }
                //if the mouse is down and mouse is moved than start creating the rectangle
                d3.select(window)
                    .on("mousemove.zoomRect", function () {
                        console.log("zooming rectangle changing")
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
                        console.log("zooming complete");
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
            chart.plot();
        });


        function hover() {
            d3.selectAll("path").classed("line-hover", function (d) {
                return d.hover
            })
        }


    };

    chart.plot();


    window.addEventListener('resize', function () {
        width = $(obj.divId).width() - margin.left - margin.right;
        chart.plot();
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


function d3Chart(obj) {
    switch (obj.type){
        case 'line':
            d3Line(obj);
            break;
        case 'area':
            d3Area(obj);
            break;
        case 'stacked':
            d3Stacked(obj);
            break;
        case 'scattered':
            d3Scattered(obj);
            break;
        case 'bar':
            d3GroupedBar(obj);
            break;
    }
}