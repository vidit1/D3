/**
 * Created by vidit on 6/10/16.
 */
function D3Funnels(obj) {

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
    ,tickNumber = 5,funnelTop=width*0.60,funnelBottom=width*0.2,funnelBottonHeight=height*0.2;

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

  var diagonal = d3.svg.diagonal()
    .source(function(d) {return {"x":d[0].y, "y":d[0].x}; })
    .target(function(d) {return {"x":d[1].y, "y":d[1].x}; })
    .projection(function(d) { return [d.y, d.x]; });


  //Setting domain for the colors with te exceptioon of date column
  color.domain(data.map(function (d) {
    return d.label
  }));



  var cities = d3.layout.stack()(data.map(function (d) {
      return d.data.map(function (d) {
        return {date:d.date,y:+d.y,label:d.label}
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

  chart.plot = function () {

    funnelTop=width*0.60;
    funnelBottom=width*0.2;
    funnelBottonHeight=height*0.2;

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


    //Filtering data if the column is disable or not
    var series = cities.filter(function (d) {
      return d.disabled;
    });
    

    //Chart Title
    svg.append('g').attr('class', 'titleWrap').append('text')
      .attr("x", (width / 2))
      .attr("y", (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .text(obj.title.text);



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
        .style("stroke-width", "1px");

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
        return {date: d.date, y: +d.y,label:d.label};
      })
    }));

    for (var i = 0; i < series.length; i++) {
      series[i].data = temp[i]
    }

    x.domain([0]);
    x.rangeBands([0, width], 0.1, 0);
    y.domain([
      0,
      d3.max(series, function (c) {
        return d3.max(c.data, function (v) {
          return v.y0 + v.y;
        });
      }) + 4
    ])

    var tickInterval = parseInt(x.domain().length / tickNumber);
    var ticks = x.domain().filter(function (d, i) {
      return !(i % tickInterval);
    });
    xAxis.tickValues(ticks);

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


    var poly1 = [
      {"x": 0, "y": margin.top},
      {"x": (width-funnelTop)/2, "y": margin.top},
      {"x":(width-funnelBottom)/2,"y":height-funnelBottonHeight},
      {"x":(width-funnelBottom)/2,"y":height},
      {"x":0,"y":height}

    ];

    var poly2 = [
      {"x": width, "y": margin.top},
      {"x": (width-funnelTop)/2+funnelTop+5, "y": margin.top},
      {"x":(width-funnelBottom)/2+funnelBottom+5,"y":height-funnelBottonHeight},
      {"x":(width-funnelBottom)/2+funnelBottom+5,"y":height},
      {"x":width,"y":height}

    ];

    var polygon = svg.selectAll("polygon")
      .data([poly2,poly1])
      .enter().append("polygon")
      .attr("points", function (d) {
        return d.map(function (d) {
          return [(d.x), (d.y)].join(",");
        }).join(" ");
      })
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("fill","white");

    //selecting all the paths
    var path = svg.selectAll("rect");

    var rectangle = d3.selectAll('rect');
    path.on('mousemove',null);
    //mouse over function
    path
      .on('mousemove', function (d) {
        nvtooltip.cleanup();
        var cord = d3.mouse(this);
        if (cord[1] < 2*margin.top || cord[1] > (height+2*margin.top) ||cord[0]<margin.left || cord[0] > (width+margin.left)|| series.length==0 || series[0].data.length==0) {
          return
        }
        nvtooltip.show(obj.divId,[cord[0], cord[1]], obj.tooltip.formatter(d),'n');
      });
      polygon.on('mouseover',function () {
      nvtooltip.cleanup();
      });

    var labelConnectors = svg.append("g")
      .attr('class', "connectors");
    var previousLabelHeight = 0,singPoint=height/d3.max(y.domain());
    for(i=0;i<series.length;i++) {
      console.log(series[i]);
      var section = series[i].data[0];
      var startLocation = section.y0 * singPoint, sectionHeight = section.y * singPoint, bottomLeft = funnelBottonHeight - (startLocation), x1, y1, y2, endingPintY, curveData;
      funnelBottonHeight - (startLocation) >= 0 ? console.log("bottom left", funnelBottonHeight - (startLocation)) : console.log("bottom occupied");
      (sectionHeight) / 2 > (bottomLeft) ? console.log("in cone") : console.log("in bottom");
      var label  = labelConnectors.append("g");
      var text;
      console.log("previous label height = ", previousLabelHeight);
      if ((sectionHeight) / 2 < (bottomLeft)) {
        x1 = (width - funnelBottom) / 2 + funnelBottom;
        y1 = (startLocation + sectionHeight / 2);

        console.log("rectangle y = ",y1);
        endingPintY = y1;

        if ((endingPintY - previousLabelHeight) <= 10) {
          endingPintY = previousLabelHeight + 15
          console.log("final y=",endingPintY)
        }

        curveData = [{x: x1, y: (height) - y1}, {x: x1 + 50, y: height - (endingPintY)}];
        text = label.append("text")
          .attr("x",x1+70)
          .attr("y",height - (endingPintY))
          .attr("text-anchor", "left")
          .style("font-size", "15px");

        text.append("tspan")
          .text(series[i].label);

        text.append("tspan")
          .attr("x",x1+70)
          .attr("dx","0")
          .attr("dy","1em")
          .text(series[i].data[0].y + " ("+((series[i].data[0].y/series[series.length-1].data[0].y)*100).toFixed(2)+"%) ");

      } else {

        var arr = findInterSection(
          width / 2, height - (startLocation + sectionHeight / 2),
          width, height - (startLocation + sectionHeight / 2),
          (width - funnelTop) / 2 + funnelTop, margin.top,
          (width - funnelBottom) / 2 + funnelBottom, height - funnelBottonHeight);

        x1 = arr[0];
        y1 = arr[1];

        endingPintY = y1;
        if ((endingPintY - (endingPintY- previousLabelHeight)) <= 15) {
          endingPintY = previousLabelHeight + endingPintY + 15
          console.log("final y=",endingPintY)
        }

        curveData = [{x: x1, y: y1}, {x: x1 + 50, y: endingPintY}];
        text = label.append("text")
          .attr("x",x1+70)
          .attr("y",endingPintY)
          .attr("text-anchor", "left")
          .style("font-size", "15px");

        text.append("tspan")
          .text(series[i].label);

        text.append("tspan")
          .attr("x",x1+70)
          .attr("dx","0")
          .attr("dy","1em")
          .text(series[i].data[0].y + " ("+((series[i].data[0].y/series[series.length-1].data[0].y)*100).toFixed(2)+"%) ");

      }

      previousLabelHeight = endingPintY +20;


      label.datum(curveData)
        .append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .attr("stroke", "#444")
        .attr("stroke-width", 2)
        .attr("fill", "none")


      ;

    }

  };

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


function findInterSection(x1,y1,x2,y2,x3,y3,x4,y4){
  var m1=(y2-y1)/(x2-x1),m2=(y4-y3)/(x4-x3),b1=(y1-m1*x1),b2=(y3-m2*x3);
  return [((b2-b1)/(m1-m2)),-1*((b1*m2-b2*m1)/(m1-m2))];
}
