/**
 * Created by vidit on 6/10/16.
 */
function D3Stacked(obj) {

  d3.selectAll(obj.divId).on('mousemove',null)
    .on('mouseout',null)
    .on('mousedown',null)

  var chart = {};

  var data = obj.series;

  var downloadFlag = false;

  //Setting margin and width and height
  var margin = {top: 20, right: 30, bottom: 60, left: 50},
    width = $(obj.divId).width() - margin.left - margin.right,
    height = obj.height ? obj.height : 550 - margin.top - margin.bottom
    ,tickNumber = 5;

  //Parse date function
  var legendToggleTextFlag  = false

  //x
  var x = d3.scale.ordinal()
    .domain([0, 1])
    .rangeBands([0, width], 0.1, 0);

  //y
  var y = d3.scale.linear().range([height, margin.top]);

  var color = d3.scale.ordinal()
    .range(['#DF9930', '#1A1D1E', '#5E95E1', '#DD4949', '#49C3DD', '#7AE1AB', '#849448', '#7A5D4B', '#A971D8']);

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
    .tickFormat(d3.format("s"))
    .orient("left");

  var mouseMoveHide = 'visible',
    HoverFlag = true;

  //calling legend and setting width,height,margin,color
  var legend ;


  //Setting domain for the colors with te exceptioon of date column
  color.domain(data.map(function (d) {
    return d.label
  }));

  var cities = d3.layout.stack()(data.map(function (d) {
      return d.data.map(function (d) {
        return {date:d.date,y:+d.y}
      })
    })
  );


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
  if(div==null){
    return
  }
  var mc = new Hammer.Manager(div,{
    touchAction: 'auto',
    recognizers: [
      [Hammer.Pan,{ direction: Hammer.DIRECTION_HORIZONTAL }]
    ]
  });
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
        chart.plot();
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
        //slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
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
      .attr("width", width +   margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "chart")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    legend = d3Legend().height(height).width(width).margin(margin).color(color);

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

    if(svg.select('.legendWrap').node()&&margin.bottom<(svg.select('.legendWrap').node().getBoundingClientRect().height+30)){
      margin.bottom = svg.select('.legendWrap').node().getBoundingClientRect().height+30;
      chart.plot();
    }


    //on legend click toggle line
    legend.dispatch.on('legendClick', function (d) {
      d.disabled = !d.disabled;
      chart.plot();
    });
    
    //Chart Title
    svg.append('g').attr('class', 'titleWrap').append('text')
      .attr("x", (width / 2))
      .attr("y", (margin.top / 2))
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

      d3.select(obj.divId + " > svg > g > g[class='download']").on("mousedown", function () {
        downloadAsCsv(rawData, obj.title.text)
      });
    }

    if(obj.exporting) {

      //Graph Detail button
      svg.append('g').attr('class', 'graphDetails')
        .classed('hidden', downloadFlag)
        .style("z-index", 1000)
        .append("rect")
        .attr('x', width)
        .attr("y", 10)
        .attr("rx", 2)
        .style("fill", "#f2f2f2")
        .style("stroke", "#666666")
        .style("stroke-width", "1px")

      d3.select(obj.divId + " > svg > g > g[class='graphDetails']").append('text')
        .attr('x', width - 40)
        .attr("y", 10)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '1.5em')
        .text('\uf05a')
        .style("cursor", "pointer");


      d3.select(obj.divId + " > svg > g > g[class='graphDetails']").on("mousedown", function () {
        obj.exporting.buttons.customButton.onclick(obj)
      });
    }
    var qkeyButton={},textLength=0;
    if(obj.exporting&&obj.exporting.buttons.hasOwnProperty('qkeyButton')){
      qkeyButton = obj.exporting.buttons.qkeyButton;
      if(qkeyButton.type=="legendToggele"){
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
          });
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
    d3.select(obj.divId+" > svg > g > g[class='resetZoom']").on("mousedown", function () {
      cities.forEach(function (d, i) {
        d.data = rawData[i].data;
      });
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
        return {date: d.date, y: +d.y};
      })
    }));
    for (var i = 0; i < series.length; i++) {
      series[i].data = temp[i]
    }
    x.domain(series[0].data.map(function (d) {
      return d.date;
    }));
    x.rangeBands([0, width], 0.1, 0);
    y.domain([
      0,
      d3.max(series, function (c) {
        return d3.max(c.data, function (v) {
          return v.y0 + v.y;
        });
      }) + 4
    ]).nice();

    var tickInterval = parseInt(x.domain().length / tickNumber);
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
      .text(obj.yAxis && obj.xAxis.title.text ? obj.xAxis.title.text : "");


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
      .text(obj.xAxis && obj.xAxis.title.text ? obj.xAxis.title.text : "");

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
        return x(d.date);
      })
      .attr("y", function (d) {
        return y(d.y + d.y0);
      })
      .attr("height", function (d) {
        return y(d.y0) - y(d.y + d.y0);
      })
      .attr("width", x.rangeBand() );

    //selecting all the paths
    var path = svg.selectAll("rect");

    var rectangle = d3.selectAll('rect');
    path.on('mouseover',null);
    //mouse over function
    path
      .on('mouseover', function (d) {
        nvtooltip.cleanup();
        var cord = d3.mouse(this);
        if (cord[1] < 2*margin.top || cord[1] > (height+2*margin.top) ||cord[0]<margin.left || cord[0] > (width+margin.left)|| series.length==0 || series[0].data.length==0) {
          return
        }
        var legends = series.map(function (d) {
          return d.label;
        });

        var xpos = parseInt(Math.max(0,(cord[0]-margin.left))/(x.rangeBand()));
        xpos = xpos>series[0].data.length?series[0].data.length-1:xpos;
        var foundFlag = d.date instanceof Date ? moment(series[0].data[xpos].date)==moment(d.date):series[0].data[xpos].date==d.date;
        while(foundFlag==false)
        {
          var greaterFlag = d.date instanceof Date ? moment(series[0].data[xpos].date)>moment(d.date) : series[0].data[xpos].date>d.date;
          xpos = greaterFlag==true ? xpos-1:xpos+1;
          foundFlag = d.date instanceof Date ? moment(series[0].data[xpos].date).format("YYYY-MM-DD")==moment(d.date).format("YYYY-MM-DD"):series[0].data[xpos].date==d.date;
        }
        var tempData = series.map(function (d) {
          return d.data[xpos]
        })
        nvtooltip.show(obj.divId, [x(d.date) + margin.left + x.rangeBand() / 2, cord[1]], obj.tooltip.formatter(tempData,legends));
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
        if (origin[1] < 2 * margin.top || origin[1] > (height+2*margin.top)||origin[0]<margin.left || origin[0] > (width+margin.left)  || series.length == 0) {
          HoverFlag = true;
          return
        }
        //if the mouse is down and mouse is moved than start creating the rectangle
        d3.selectAll(obj.divId)
          .on("mousemove.zoomRect", function (d) {
            //current location of mouse
            var m = d3.mouse(e);
            //find the min between the width and and cursor location to prevent the rectangle move out of the chart
            m[0] = Math.max(0, Math.min(width, (m[0] - margin.left)));

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
            m[0] = Math.max(0, Math.min(width, (m[0] - margin.left)));

            //check that the origin location on x axis of the mouse should not be eqaul to last
            if (m[0] !== origin[0] && series[0].data.length > 20) {

              cities.forEach(function (d) {

                //slicing each line if and only if the length of data > 50 (minimum no of ticks should be present in the graph)
                if (d.data.length > 10) {
                  d.data = d.data.filter(function (a) {
                    if (m[0] < origin[0]) {
                      return x(a.date) >= m[0] && x(a.date) <= origin[0];
                    } else {
                      return x(a.date) <= m[0] && x(a.date) >= origin[0];
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
    
  }


  chart.plot();

  var initialWidth = $(obj.divId).width();
  setTimeout(function () {
    if ($(obj.divId).width() != initialWidth) {
      width = $(obj.divId).width() -margin.left - margin.right;
      chart.plot()
    }
  }, 2000);

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
