


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



