import './plotly-basic-2.35.2.min.js'

export function initializeChart(id, traces, exemplarTrace, rangeStartTime, rangeEndTime, serverLocale, chartInterop) {
    registerLocale(serverLocale);

    var chartContainerDiv = document.getElementById(id);
    if (!chartContainerDiv) {
        console.log(`Couldn't find container '${id}' when initializing chart.`);
        return;
    }

    // Reusing a div can create issues with chart lines appearing beyond the end range.
    // Workaround this issue by replacing the chart div. Ensures we start from a new state.
    var chartDiv = document.createElement("div");
    chartContainerDiv.replaceChildren(chartDiv);

    var themeColors = getThemeColors();

    var data = [];
    for (var i = 0; i < traces.length; i++) {
        var name = traces[i].name || "Value";
        var t = {
            x: traces[i].x,
            y: traces[i].y,
            name: name,
            text: traces[i].tooltips,
            hoverinfo: 'text',
            stackgroup: "one"
        };
        data.push(t);
    }

    var points = {
        x: exemplarTrace.x,
        y: exemplarTrace.y,
        name: exemplarTrace.name,
        text: exemplarTrace.tooltips,
        hoverinfo: 'text',
        traceData: exemplarTrace.traceData,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 16,
            color: themeColors.pointColor,
            line: {
                color: themeColors.backgroundColor,
                width: 1
            }
        }
    };
    data.push(points);

    // Width and height are set using ResizeObserver + ploty resize call.
    var layout = {
        paper_bgcolor: themeColors.backgroundColor,
        plot_bgcolor: themeColors.backgroundColor,
        margin: { t: 0, r: 0, b: 40, l: 50 },
        xaxis: {
            type: 'date',
            range: [rangeEndTime, rangeStartTime],
            fixedrange: true,
            tickformat: "%X",
            color: themeColors.textColor
        },
        yaxis: {
            rangemode: "tozero",
            fixedrange: true,
            color: themeColors.textColor
        },
        hovermode: "closest",
        showlegend: true,
        legend: {
            orientation: "h",
            font: {
                color: themeColors.textColor
            },
            traceorder: "normal",
            itemclick: false,
            itemdoubleclick: false
        }
    };

    var options = { scrollZoom: false, displayModeBar: false };

    var plot = Plotly.newPlot(chartDiv, data, layout, options);

    fixTraceLineRendering(chartDiv);

    // We only want a pointer cursor when the mouse is hovering over an exemplar point.
    // Set the drag layer cursor back to the default and then use plotly_hover/ploty_unhover events to set to pointer.
    var dragLayer = document.getElementsByClassName('nsewdrag')[0];
    dragLayer.style.cursor = 'default';

    // Use mousedown instead of plotly_click event because plotly_click has issues with updating charts.
    // The current point is tracked by setting it with hover/unhover events and then mousedown uses the current value.
    var currentPoint = null;
    chartDiv.on('plotly_hover', function (data) {
        var point = data.points[0];
        if (point.fullData.name == exemplarTrace.name) {
            currentPoint = point;
            dragLayer.style.cursor = 'pointer';
        }
    });
    chartDiv.on('plotly_unhover', function (data) {
        var point = data.points[0];
        if (point.fullData.name == exemplarTrace.name) {
            currentPoint = null;
            dragLayer.style.cursor = 'default';
        }
    });
    chartDiv.addEventListener("mousedown", (e) => {
        if (currentPoint) {
            var point = currentPoint;
            var pointTraceData = point.data.traceData[point.pointIndex];

            chartInterop.invokeMethodAsync('ViewSpan', pointTraceData.traceId, pointTraceData.spanId);
        }
    });

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // Don't resize if not visible.
            var display = window.getComputedStyle(entry.target).display;
            var isHidden = !display || display === "none";
            if (!isHidden) {
                Plotly.Plots.resize(entry.target);
            }
        }
    });
    plot.then(plotyDiv => {
        resizeObserver.observe(plotyDiv);
    });
}

export function updateChart(id, traces, exemplarTrace, rangeStartTime, rangeEndTime) {
    var chartContainerDiv = document.getElementById(id);
    if (!chartContainerDiv) {
        console.log(`Couldn't find container '${id}' when updating chart.`);
        return;
    }

    var chartDiv = chartContainerDiv.firstChild;
    if (!chartDiv) {
        console.log(`Couldn't find div inside container '${id}' when updating chart. Chart may not have been successfully initialized.`);
        return;
    }

    var themeColors = getThemeColors();

    var xUpdate = [];
    var yUpdate = [];
    var tooltipsUpdate = [];
    var traceData = [];
    for (var i = 0; i < traces.length; i++) {
        xUpdate.push(traces[i].x);
        yUpdate.push(traces[i].y);
        tooltipsUpdate.push(traces[i].tooltips);
        traceData.push(traces.traceData);
    }

    xUpdate.push(exemplarTrace.x);
    yUpdate.push(exemplarTrace.y);
    tooltipsUpdate.push(exemplarTrace.tooltips);
    traceData.push(exemplarTrace.traceData);

    var data = {
        x: xUpdate,
        y: yUpdate,
        text: tooltipsUpdate,
        traceData: traceData
    };

    var layout = {
        xaxis: {
            type: 'date',
            range: [rangeEndTime, rangeStartTime],
            fixedrange: true,
            tickformat: "%X",
            color: themeColors.textColor
        }
    };

    Plotly.update(chartDiv, data, layout);

    fixTraceLineRendering(chartDiv);
}

function getThemeColors() {
    // Get colors from the current light/dark theme.
    var style = getComputedStyle(document.body);
    return {
        backgroundColor: style.getPropertyValue("--fill-color"),
        textColor: style.getPropertyValue("--neutral-foreground-rest"),
        pointColor: style.getPropertyValue("--accent-fill-rest")
    };
}

function fixTraceLineRendering(chartDiv) {
    // In stack area charts Plotly orders traces so the top line area overwrites the line of areas below it.
    // This isn't the effect we want. When the P50, P90 and P99 values are the same, the line displayed is P99
    // on the P50 area.
    //
    // The fix is to reverse the order of traces so the correct line is on top. There isn't a way to do this
    // with CSS because SVG doesn't support z-index. Node order is what determines the rendering order.
    //
    // https://github.com/plotly/plotly.js/issues/6579
    var parent = chartDiv.querySelector(".scatterlayer");

    if (parent.childNodes.length > 0) {
        for (var i = 1; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            parent.insertBefore(child, parent.firstChild);
        }

        // Check if there is a trace with points. It should be top most.
        for (var i = 0; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            if (child.querySelector(".point")) {
                // Append trace to parent to move to the last in the collection.
                parent.appendChild(child);
            }
        }
    }
}

function registerLocale(serverLocale) {
    // Register the locale for Plotly.js. This is to enable localization of time format shown by the charts.
    // Changing plotly.js time formatting is better than supplying values from the server which is very difficult to do correctly.

    // Right now necessary changes are to:
    // -Update AM/PM
    // -Update time format to 12/24 hour.
    var locale = {
        moduleType: 'locale',
        name: 'en',
        dictionary: {
            'Click to enter Colorscale title': 'Click to enter Colourscale title'
        },
        format: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            periods: serverLocale.periods,
            dateTime: '%a %b %e %X %Y',
            date: '%d/%m/%Y',
            time: serverLocale.time,
            decimal: '.',
            thousands: ',',
            grouping: [3],
            currency: ['$', ''],
            year: '%Y',
            month: '%b %Y',
            dayMonth: '%b %-d',
            dayMonthYear: '%b %-d, %Y'
        }
    };
    Plotly.register(locale);
}

// SIG // Begin signature block
// SIG // MIIoKgYJKoZIhvcNAQcCoIIoGzCCKBcCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // Gq1C/btibJfKOL8aw1jLXS+Clsy0YW7BgFrg7fNQqi2g
// SIG // gg12MIIF9DCCA9ygAwIBAgITMwAABARsdAb/VysncgAA
// SIG // AAAEBDANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExNFoX
// SIG // DTI1MDkxMTIwMTExNFowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // tCg32mOdDA6rBBnZSMwxwXegqiDEUFlvQH9Sxww07hY3
// SIG // w7L52tJxLg0mCZjcszQddI6W4NJYb5E9QM319kyyE0l8
// SIG // EvA/pgcxgljDP8E6XIlgVf6W40ms286Cr0azaA1f7vaJ
// SIG // jjNhGsMqOSSSXTZDNnfKs5ENG0bkXeB2q5hrp0qLsm/T
// SIG // WO3oFjeROZVHN2tgETswHR3WKTm6QjnXgGNj+V6rSZJO
// SIG // /WkTqc8NesAo3Up/KjMwgc0e67x9llZLxRyyMWUBE9co
// SIG // T2+pUZqYAUDZ84nR1djnMY3PMDYiA84Gw5JpceeED38O
// SIG // 0cEIvKdX8uG8oQa047+evMfDRr94MG9EWwIDAQABo4IB
// SIG // czCCAW8wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFPIboTWxEw1PmVpZS+AzTDwo
// SIG // oxFOMEUGA1UdEQQ+MDykOjA4MR4wHAYDVQQLExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xFjAUBgNVBAUTDTIzMDAx
// SIG // Mis1MDI5MjMwHwYDVR0jBBgwFoAUSG5k5VAF04KqFzc3
// SIG // IrVtqMp1ApUwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNybDBhBggr
// SIG // BgEFBQcBAQRVMFMwUQYIKwYBBQUHMAKGRWh0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWlj
// SIG // Q29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNydDAMBgNV
// SIG // HRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQCI5g/S
// SIG // KUFb3wdUHob6Qhnu0Hk0JCkO4925gzI8EqhS+K4umnvS
// SIG // BU3acsJ+bJprUiMimA59/5x7WhJ9F9TQYy+aD9AYwMtb
// SIG // KsQ/rst+QflfML+Rq8YTAyT/JdkIy7R/1IJUkyIS6srf
// SIG // G1AKlX8n6YeAjjEb8MI07wobQp1F1wArgl2B1mpTqHND
// SIG // lNqBjfpjySCScWjUHNbIwbDGxiFr93JoEh5AhJqzL+8m
// SIG // onaXj7elfsjzIpPnl8NyH2eXjTojYC9a2c4EiX0571Ko
// SIG // mhENF3RtR25A7/X7+gk6upuE8tyMy4sBkl2MUSF08U+E
// SIG // 2LOVcR8trhYxV1lUi9CdgEU2CxODspdcFwxdT1+G8YNc
// SIG // gzHyjx3BNSI4nOZcdSnStUpGhCXbaOIXfvtOSfQX/UwJ
// SIG // oruhCugvTnub0Wna6CQiturglCOMyIy/6hu5rMFvqk9A
// SIG // ltIJ0fSR5FwljW6PHHDJNbCWrZkaEgIn24M2mG1M/Ppb
// SIG // /iF8uRhbgJi5zWxo2nAdyDBqWvpWxYIoee/3yIWpquVY
// SIG // cYGhJp/1I1sq/nD4gBVrk1SKX7Do2xAMMO+cFETTNSJq
// SIG // fTSSsntTtuBLKRB5mw5qglHKuzapDiiBuD1Zt4QwxA/1
// SIG // kKcyQ5L7uBayG78kxlVNNbyrIOFH3HYmdH0Pv1dIX/Mq
// SIG // 7avQpAfIiLpOWwcbjzCCB3owggVioAMCAQICCmEOkNIA
// SIG // AAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290
// SIG // IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDExMB4XDTEx
// SIG // MDcwODIwNTkwOVoXDTI2MDcwODIxMDkwOVowfjELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0
// SIG // IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCCAiIwDQYJKoZI
// SIG // hvcNAQEBBQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6q
// SIG // ghBNNLrytlghn0IbKmvpWlCquAY4GgRJun/DDB7dN2vG
// SIG // EtgL8DjCmQawyDnVARQxQtOJDXlkh36UYCRsr55JnOlo
// SIG // XtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv
// SIG // 56sIUM+zRLdd2MQuA3WraPPLbfM6XKEW9Ea64DhkrG5k
// SIG // NXimoGMPLdNAk/jj3gcN1Vx5pUkp5w2+oBN3vpQ97/vj
// SIG // K1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd
// SIG // 6IlPhBryoS9Z5JA7La4zWMW3Pv4y07MDPbGyr5I4ftKd
// SIG // gCz1TlaRITUlwzluZH9TupwPrRkjhMv0ugOGjfdf8NBS
// SIG // v4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKuHCOnqWbs
// SIG // YR9q4ShJnV+I4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43Bd
// SIG // D1FGd7P4AOG8rAKCX9vAFbO9G9RVS+c5oQ/pI0m8GLhE
// SIG // fEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkwp6uO3+xb
// SIG // n6/83bBm4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7Iv
// SIG // hNdXnFy/dygo8e1twyiPLI9AN0/B4YVEicQJTMXUpUMv
// SIG // dJX3bvh4IFgsE11glZo+TzOE2rCIF96eTvSWsLxGoGyY
// SIG // 0uDWiIwLAgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEE
// SIG // AwIBADAdBgNVHQ4EFgQUSG5k5VAF04KqFzc3IrVtqMp1
// SIG // ApUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
// SIG // VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0j
// SIG // BBgwFoAUci06AjGQQ7kUBU7h6qfHMdEjiTQwWgYDVR0f
// SIG // BFMwUTBPoE2gS4ZJaHR0cDovL2NybC5taWNyb3NvZnQu
// SIG // Y29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0
// SIG // MjAxMV8yMDExXzAzXzIyLmNybDBeBggrBgEFBQcBAQRS
// SIG // MFAwTgYIKwYBBQUHMAKGQmh0dHA6Ly93d3cubWljcm9z
// SIG // b2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0MjAx
// SIG // MV8yMDExXzAzXzIyLmNydDCBnwYDVR0gBIGXMIGUMIGR
// SIG // BgkrBgEEAYI3LgMwgYMwPwYIKwYBBQUHAgEWM2h0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvZG9jcy9w
// SIG // cmltYXJ5Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBM
// SIG // AGUAZwBhAGwAXwBwAG8AbABpAGMAeQBfAHMAdABhAHQA
// SIG // ZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEA
// SIG // Z/KGpZjgVHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVf
// SIG // Liw++MNy0W2D/r4/6ArKO79HqaPzadtjvyI1pZddZYSQ
// SIG // fYtGUFXYDJJ80hpLHPM8QotS0LD9a+M+By4pm+Y9G6XU
// SIG // tR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELuk
// SIG // qQUMm+1o+mgulaAqPyprWEljHwlpblqYluSD9MCP80Yr
// SIG // 3vw70L01724lruWvJ+3Q3fMOr5kol5hNDj0L8giJ1h/D
// SIG // Mhji8MUtzluetEk5CsYKwsatruWy2dsViFFFWDgycSca
// SIG // f7H0J/jeLDogaZiyWYlobm+nt3TDQAUGpgEqKD6CPxNN
// SIG // ZgvAs0314Y9/HG8VfUWnduVAKmWjw11SYobDHWM2l4bf
// SIG // 2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbRBrF1HxS+
// SIG // YWG18NzGGwS+30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOX
// SIG // pQlLSBCZgB/QACnFsZulP0V3HjXG0qKin3p6IvpIlR+r
// SIG // +0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9azI2h15q/6
// SIG // /IvrC4DqaTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4
// SIG // ETIheu9BCrE/+6jMpF3BoYibV3FWTkhFwELJm3ZbCoBI
// SIG // a/15n8G9bW1qyVJzEw16UM0xghoMMIIaCAIBATCBlTB+
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAE
// SIG // BGx0Bv9XKydyAAAAAAQEMA0GCWCGSAFlAwQCAQUAoIGu
// SIG // MBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisG
// SIG // AQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3
// SIG // DQEJBDEiBCCN0PAwtolw/Q8mhHNMtFp0MWNT0EugD2Sm
// SIG // US5yPu9HpjBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBp
// SIG // AGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBAHPyohYw
// SIG // fE4atrt286ZNuWMy9cUnLOmsl+te0HhVEiWoUKq14890
// SIG // 2Qx4jIeluk2nerbzOgRkrDMfJF19Nou2nCiTCiNJOfH9
// SIG // vkSqzS+QHLOM8XpsOO8KWh2oyMD7TZO3eeMizKu2Jg9a
// SIG // 9H6hkMTfD4lqo73DMFfIfSVnFYQq+f5UtQCfDQTdGzFW
// SIG // +IFOra2xbi01h8XmNNUfO8s5Qu7Bf9yKHaYqe/H3R/QO
// SIG // RbYr8fEaDlFPEYr6NEO5+huqeiCqf/S0l5ajHe/XfmqU
// SIG // 2otJVVvSDx9Nbq0hBF4gSQJZhJAVrSYxizPW4EOBBB52
// SIG // RZf/Uqo/qqw8tz4tugMrbzuTCJGhgheWMIIXkgYKKwYB
// SIG // BAGCNwMDATGCF4Iwghd+BgkqhkiG9w0BBwKgghdvMIIX
// SIG // awIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUQYLKoZIhvcN
// SIG // AQkQAQSgggFABIIBPDCCATgCAQEGCisGAQQBhFkKAwEw
// SIG // MTANBglghkgBZQMEAgEFAAQgcyDKn/syF+jTH7lrxmxM
// SIG // NmL4GNiYqbQlu2yKou0senwCBmcakDFdkRgSMjAyNDEx
// SIG // MDExNjQwMzEuMTJaMASAAgH0oIHRpIHOMIHLMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQg
// SIG // QW1lcmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hp
// SIG // ZWxkIFRTUyBFU046MzMwMy0wNUUwLUQ5NDcxJTAjBgNV
// SIG // BAMTHE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wg
// SIG // ghHtMIIHIDCCBQigAwIBAgITMwAAAebZQp7qAPh94QAB
// SIG // AAAB5jANBgkqhkiG9w0BAQsFADB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDAeFw0yMzEyMDYxODQ1MTVaFw0y
// SIG // NTAzMDUxODQ1MTVaMIHLMQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSUwIwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVy
// SIG // YXRpb25zMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046
// SIG // MzMwMy0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3
// SIG // DQEBAQUAA4ICDwAwggIKAoICAQC9vph84tgluEzm/wpN
// SIG // KlAjcElGzflvKADZ1D+2d/ieYYEtF2HKMrKGFDOLpLWW
// SIG // G5DEyiKblYKrE2nt540OGu35Zx0gXJBE0zWanZEAjCjt
// SIG // 4eGBi+uakZsk70zHTQHHyfP+B3m2BSSNFPhgsVIPp6vo
// SIG // /9t6OeNezIwX5E5+VwEG37nZgEexQF2fQZYbxQ1AauqD
// SIG // vRdXsSpK1dh1UBt9EaMszuucaR5nMwQN6sDjG99FzdK9
// SIG // Atzbn4SmlsoLUtRAh/768sKd0Y1hMmKVHwIX8/4JuURU
// SIG // BRZ0JWu0NYQBp8khku18Q8CAQ500tFB7VH3pD8zoA4lc
// SIG // A7JkxTGoPKrufm+lRZAA4iMgbcLZ2P/xSdnKFxU8vL31
// SIG // RoNlZJiGL5MqTXvvyBLz+MRP4En9Nye1N8x/lJD1stdN
// SIG // o5wJG+mgXsE/zfzg2GaVqQczFHg0Nl8bpIqnNFUReQRq
// SIG // 3C1jVYMCScegNzHeYtw5OmZ/7eVnRmjXlCsLvdsxOzc1
// SIG // YVn6nZLkQD5y31HYrB9iIHuswhaMv2hJNNjVndkpWy93
// SIG // 4PIZuWTMk360kjXPFwl2Wv1Tzm9tOrCq8+l408KIL6J+
// SIG // efoGNkR8YB3M+u1tYeVDO/TcObGHxaGFB6QZxAUpnfB5
// SIG // N/MmBNxMOqzG1N8QiwW8gtjjMJiFBf6iYYrCjtRwF7IP
// SIG // dQLFtQIDAQABo4IBSTCCAUUwHQYDVR0OBBYEFOUEMXnt
// SIG // N54+11ZM+Qu7Q5rg3Fc9MB8GA1UdIwQYMBaAFJ+nFV0A
// SIG // XmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCG
// SIG // Tmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
// SIG // Y3JsL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQQ0El
// SIG // MjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYI
// SIG // KwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwVGltZS1T
// SIG // dGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1UdEwEB
// SIG // /wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYD
// SIG // VR0PAQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4ICAQBh
// SIG // buogTapRsuwSkaFMQ6dyu8ZCYUpWQ8iIrbi40tU2hK6p
// SIG // Hgu0hj0z/9zFRRx5DfhukjvbjA/dS5VYfxz1EIbPlt89
// SIG // 7MJ2sBGO2YLYwYelfJpDwbB0XS9Zkrqpzq6X/lmDQDn3
// SIG // G5vcYpYQCJ55LLvyFlJ195AVo4Wy8UX5p7g9W3MgNHQM
// SIG // pM+EV64+cszj4Ho5aQmeKGtKy7w72eRY/vWDuptrvzru
// SIG // FNmKCIt12UcA5BOsXp1Ptkjx2yRsCj77DSml0zVYjqW/
// SIG // ISWkrGjyeVJ+khzctxaLkklVwCxigokD6fkWby0hCEKT
// SIG // OTPMzhugPIAcxcHsR2sx01YRa9pH2zvddsuBEfSFG6Cj
// SIG // 0QSvEZ/M9mJ+h4miaQSR7AEbVGDbyRKkYn80S+3AmRlh
// SIG // 3ZOe+BFqJ57OXdeIDSHbvHzJ7oTqG896l3eUhPsZg69f
// SIG // NgxTxlvRNmRE/+61Yj7Z1uB0XYQP60rsMLdTlVYEyZUl
// SIG // 5MLTL5LvqFozZlS2Xoji4BEP6ddVTzmHJ4odOZMWTTeQ
// SIG // 0IwnWG98vWv/roPegCr1G61FVrdXLE3AXIft4ZN4ZkDT
// SIG // noAhPw7DZNPRlSW4TbVj/Lw0XvnLYNwMUA9ouY/wx9te
// SIG // TaJ8vTkbgYyaOYKFz6rNRXZ4af6e3IXwMCffCaspKUXC
// SIG // 72YMu5W8L/zyTxsNUEgBbTCCB3EwggVZoAMCAQICEzMA
// SIG // AAAVxedrngKbSZkAAAAAABUwDQYJKoZIhvcNAQELBQAw
// SIG // gYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1p
// SIG // Y3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0
// SIG // eSAyMDEwMB4XDTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4
// SIG // MzIyNVowfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UE
// SIG // AxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAw
// SIG // ggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDk
// SIG // 4aZM57RyIQt5osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX
// SIG // 9gF/bErg4r25PhdgM/9cT8dm95VTcVrifkpa/rg2Z4VG
// SIG // Iwy1jRPPdzLAEBjoYH1qUoNEt6aORmsHFPPFdvWGUNzB
// SIG // RMhxXFExN6AKOG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2
// SIG // Nr41JmTamDu6GnszrYBbfowQHJ1S/rboYiXcag/PXfT+
// SIG // jlPP1uyFVk3v3byNpOORj7I5LFGc6XBpDco2LXCOMcg1
// SIG // KL3jtIckw+DJj361VI/c+gVVmG1oO5pGve2krnopN6zL
// SIG // 64NF50ZuyjLVwIYwXE8s4mKyzbnijYjklqwBSru+cakX
// SIG // W2dg3viSkR4dPf0gz3N9QZpGdc3EXzTdEonW/aUgfX78
// SIG // 2Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgSUei/BQOj0XOm
// SIG // TTd0lBw0gg/wEPK3Rxjtp+iZfD9M269ewvPV2HM9Q07B
// SIG // MzlMjgK8QmguEOqEUUbi0b1qGFphAXPKZ6Je1yh2AuIz
// SIG // GHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ
// SIG // +QuJYfM2BjUYhEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AF
// SIG // emzFER1y7435UsSFF5PAPBXbGjfHCBUYP3irRbb1Hode
// SIG // 2o+eFnJpxq57t7c+auIurQIDAQABo4IB3TCCAdkwEgYJ
// SIG // KwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQU
// SIG // KqdS/mTEmr6CkTxGNSnPEP8vBO4wHQYDVR0OBBYEFJ+n
// SIG // FV0AXmJdg/Tl0mWnG1M1GelyMFwGA1UdIARVMFMwUQYM
// SIG // KwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9S
// SIG // ZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAKBggrBgEFBQcD
// SIG // CDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNV
// SIG // HQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSME
// SIG // GDAWgBTV9lbLj+iiXGJo0T2UkFvXzpoYxDBWBgNVHR8E
// SIG // TzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRf
// SIG // MjAxMC0wNi0yMy5jcmwwWgYIKwYBBQUHAQEETjBMMEoG
// SIG // CCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2
// SIG // LTIzLmNydDANBgkqhkiG9w0BAQsFAAOCAgEAnVV9/Cqt
// SIG // 4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U5
// SIG // 18JxNj/aZGx80HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN
// SIG // 3Zi6th542DYunKmCVgADsAW+iehp4LoJ7nvfam++Kctu
// SIG // 2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f8449xvNo32X2
// SIG // pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnD
// SIG // vBewVIVCs/wMnosZiefwC2qBwoEZQhlSdYo2wh3DYXMu
// SIG // LGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDSPeZKPmY7T7uG
// SIG // +jIa2Zb0j/aRAfbOxnT99kxybxCrdTDFNLB62FD+Cljd
// SIG // QDzHVG2dY3RILLFORy3BFARxv2T5JL5zbcqOCb2zAVdJ
// SIG // VGTZc9d/HltEAY5aGZFrDZ+kKNxnGSgkujhLmm77IVRr
// SIG // akURR6nxt67I6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+
// SIG // CrvsQWY9af3LwUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8C
// SIG // wYKiexcdFYmNcP7ntdAoGokLjzbaukz5m/8K6TT4JDVn
// SIG // K+ANuOaMmdbhIurwJ0I9JZTmdHRbatGePu1+oDEzfbzL
// SIG // 6Xu/OHBE0ZDxyKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZq
// SIG // ELQdVTNYs6FwZvKhggNQMIICOAIBATCB+aGB0aSBzjCB
// SIG // yzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWlj
// SIG // cm9zb2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UE
// SIG // CxMeblNoaWVsZCBUU1MgRVNOOjMzMDMtMDVFMC1EOTQ3
// SIG // MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBT
// SIG // ZXJ2aWNloiMKAQEwBwYFKw4DAhoDFQDiWNBeFJ9jvaEr
// SIG // N64D1G86eL0mu6CBgzCBgKR+MHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEBCwUAAgUA6s7x
// SIG // UTAiGA8yMDI0MTEwMTA2MTg1N1oYDzIwMjQxMTAyMDYx
// SIG // ODU3WjB3MD0GCisGAQQBhFkKBAExLzAtMAoCBQDqzvFR
// SIG // AgEAMAoCAQACAhUZAgH/MAcCAQACAhP/MAoCBQDq0ELR
// SIG // AgEAMDYGCisGAQQBhFkKBAIxKDAmMAwGCisGAQQBhFkK
// SIG // AwKgCjAIAgEAAgMHoSChCjAIAgEAAgMBhqAwDQYJKoZI
// SIG // hvcNAQELBQADggEBAAvXtch36wmF9qtdhXQ6KWifr5o+
// SIG // m3kpS1gB/z2eoHdfEa/6vq1lAabj3Kgt1eiCTOxGUxKb
// SIG // nBLMcgfSFMpluCgVBdL/tpjmFfmQl4GQm9ucI2fxP2Z2
// SIG // /AmZv9ojlnvD3pyfY0rFMHR3QUhCC2cV+hSj4+Z22wIr
// SIG // eOV43F6pDyce57d+HbllFUGs5+CXojU1S/uOdvN9IXcw
// SIG // JM3c5m7IGu6fcI9kUCaRWdz7T9e+Rl93mvJ928n8NfGN
// SIG // 29WzCJkEgSZ0RMF2BbXCyd7hC9i9Io10Jo3LM6p/6DN5
// SIG // 750wxEKM4b24+WCx3jD2wBaMO7QjIn2E1oTOqZd4cvqe
// SIG // aefO2wsxggQNMIIECQIBATCBkzB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMAITMwAAAebZQp7qAPh94QABAAAB
// SIG // 5jANBglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkD
// SIG // MQ0GCyqGSIb3DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCAl
// SIG // l7wTvQ8hLlhByYd9j+us946tOKP3RUsXCf/TJhCAFjCB
// SIG // +gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIM+7o4ao
// SIG // HrMJaG8gnLO1q16hIYcRnoy6FnOCbnSD0sZZMIGYMIGA
// SIG // pH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
// SIG // bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
// SIG // FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
// SIG // TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMA
// SIG // AAHm2UKe6gD4feEAAQAAAeYwIgQg71sx4ehvG5S8yx36
// SIG // Mxu0D2uUq7dhoJLGd1P9qCEFihowDQYJKoZIhvcNAQEL
// SIG // BQAEggIAq4lVx0nZ7/MljgWBD1DX6aqlThgBNoGbpk1x
// SIG // dBXUjAmQjqcPzkm4GOleNC5PP+BKJniyx2Jb6yH6zuQ6
// SIG // H3NQ+YZ4Ynhm0lCbs9VAKEne834tsrEzeTZk12wJ6ouZ
// SIG // tzAvRKbUIL9D87fD+MthSRt/bLtqozudt5OMOUzqSEs6
// SIG // KEmStFmNKg1yHk49/yEhp4mDTpBDoFNRR9GdG791n6OG
// SIG // dqHd+kJMpayV6RH7dgt+HsolrVNVKMrVcW7Peh2CDXH4
// SIG // 7C8p6h8WkYOHuYk+ObbP72hvfIaTW93rFbNfc8R3Y7rQ
// SIG // k7ZfNtnNYGPSey9tNHOFXu19ZMn3i5Jsl61BuuGkKlMI
// SIG // Y35F5ONp3nL5x+wYFD6sEbRxdkK//808eLsLaGC+C5md
// SIG // AN2BFgSQWPLRgiX4InshzRvmFSPw/gKfx+V3jmgD4mMy
// SIG // 4w6+pjzIDhS27MvgQ0+ccQGhJyvqE3zRbhubm7GUsjmt
// SIG // uD5sT6nejxsh8dFB1NipgV3dy2Om8b8mrmgONWkmvBk2
// SIG // MJA1i1N0kVlbbUfQTx4KwrZKJntZ0gtpYhqxREMT/JHG
// SIG // Mm4SKEkutBgCAtbQdC/BrZk16Biw+l6KvOLoDt8U9pXO
// SIG // dhV1U16lDXLjTFpqWHm7D4fciEKD9DpvPLIrvPRkX3ih
// SIG // rIAGE4PitqudSsU2tpIPtbSi4ikArbA=
// SIG // End signature block
