export function startSplitterResize(
    el,
    splitter,
    paneId,
    paneNextId,
    orientation,
    clientPos,
    minValue,
    maxValue,
    minNextValue,
    maxNextValue) {

    //var el = document.getElementById(id);
    var pane = document.getElementById(paneId);
    var paneNext = document.getElementById(paneNextId);
    var paneLength;
    var paneNextLength;
    var panePerc;
    var paneNextPerc;
    var isHOrientation = orientation == 'Horizontal';

    var totalLength = 0.0;
    Array.from(el.children).forEach(element => {
        totalLength += isHOrientation
            ? element.getBoundingClientRect().width
            : element.getBoundingClientRect().height;
    });

    if (pane) {
        paneLength = isHOrientation
            ? pane.getBoundingClientRect().width
            : pane.getBoundingClientRect().height;

        panePerc = (paneLength / totalLength * 100) + '%';
    }

    if (paneNext) {
        paneNextLength = isHOrientation
            ? paneNext.getBoundingClientRect().width
            : paneNext.getBoundingClientRect().height;

        paneNextPerc = (paneNextLength / totalLength * 100) + '%';
    }

    function ensurevalue(value) {
        if (!value)
            return null;

        value = value.trim().toLowerCase();

        if (value.endsWith("%"))
            return totalLength * parseFloat(value) / 100;

        if (value.endsWith("px"))
            return parseFloat(value);

        throw 'Invalid value';
    }

    minValue = ensurevalue(minValue);
    maxValue = ensurevalue(maxValue);
    minNextValue = ensurevalue(minNextValue);
    maxNextValue = ensurevalue(maxNextValue);

    if (!document.splitterData) {
        document.splitterData = {};
    }

    document.splitterData[el] = {
        clientPos: clientPos,
        panePerc: parseFloat(panePerc),
        paneNextPerc: isFinite(parseFloat(paneNextPerc)) ? parseFloat(paneNextPerc) : 0,
        paneLength: paneLength,
        paneNextLength: isFinite(paneNextLength) ? paneNextLength : 0,
        mouseUpHandler: function (e) {
            if (document.splitterData[el] &&
                pane.style.flexBasis.includes('%') &&
                paneNext.style.flexBasis.includes('%')) {

                if (document.splitterData[el].moved === true) {
                    splitter.invokeMethodAsync(
                        'FluentMultiSplitter.OnPaneResizedAsync',
                        parseInt(pane.getAttribute('data-index')),
                        parseFloat(pane.style.flexBasis),
                        paneNext ? parseInt(paneNext.getAttribute('data-index')) : null,
                        paneNext ? parseFloat(paneNext.style.flexBasis) : null
                    );
                }

                document.removeEventListener('mousemove', document.splitterData[el].mouseMoveHandler);
                document.removeEventListener('mouseup', document.splitterData[el].mouseUpHandler);
                document.removeEventListener('touchmove', document.splitterData[el].touchMoveHandler);
                document.removeEventListener('touchend', document.splitterData[el].mouseUpHandler);
                document.splitterData[el] = null;
            }

            if (document.splitterData[el]) {
                document.splitterData[el].moved = false;
            }
        },
        mouseMoveHandler: function (e) {
            if (document.splitterData[el]) {

                const rtl = window.getComputedStyle(pane)?.getPropertyValue('direction') === 'rtl' ? -1 : 1;
                document.splitterData[el].moved = true;

                var spacePerc = document.splitterData[el].panePerc + document.splitterData[el].paneNextPerc;
                var spaceLength = document.splitterData[el].paneLength + document.splitterData[el].paneNextLength;

                var length = isHOrientation
                    ? document.splitterData[el].paneLength - (document.splitterData[el].clientPos - e.clientX) * rtl
                    : document.splitterData[el].paneLength - (document.splitterData[el].clientPos - e.clientY);

                if (length > spaceLength)
                    length = spaceLength;

                if (minValue && length < minValue) length = minValue;
                if (maxValue && length > maxValue) length = maxValue;

                if (paneNext) {
                    var nextSpace = spaceLength - length;
                    if (minNextValue && nextSpace < minNextValue) length = spaceLength - minNextValue;
                    if (maxNextValue && nextSpace > maxNextValue) length = spaceLength + maxNextValue;
                }

                var perc = length / document.splitterData[el].paneLength;
                if (!isFinite(perc)) {
                    perc = 1;
                    document.splitterData[el].panePerc = 0.1;
                    document.splitterData[el].paneLength = isHOrientation
                        ? pane.getBoundingClientRect().width
                        : pane.getBoundingClientRect().height;
                }

                var newPerc = document.splitterData[el].panePerc * perc;
                if (newPerc < 0) newPerc = 0;
                if (newPerc > 100) newPerc = 100;

                pane.style.flexBasis = newPerc + '%';
                if (paneNext)
                    paneNext.style.flexBasis = (spacePerc - newPerc) + '%';
            }
        },
        touchMoveHandler: function (e) {
            if (e.targetTouches[0]) {
                document.splitterData[el].mouseMoveHandler(e.targetTouches[0]);
            }
        }
    };
    document.addEventListener('mousemove', document.splitterData[el].mouseMoveHandler);
    document.addEventListener('mouseup', document.splitterData[el].mouseUpHandler);
    document.addEventListener('touchmove', document.splitterData[el].touchMoveHandler, { passive: true });
    document.addEventListener('touchend', document.splitterData[el].mouseUpHandler, { passive: true });
}

// SIG // Begin signature block
// SIG // MIIoTwYJKoZIhvcNAQcCoIIoQDCCKDwCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // yIHrpdi+X8FqTD7ymfjfcZVdLLz1aUmwUNRLb1Zqv9mg
// SIG // gg2FMIIGAzCCA+ugAwIBAgITMwAABAO91ZVdDzsYrQAA
// SIG // AAAEAzANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI0MDkxMjIwMTExM1oX
// SIG // DTI1MDkxMTIwMTExM1owdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // n3RnXcCDp20WFMoNNzt4s9fV12T5roRJlv+bshDfvJoM
// SIG // ZfhyRnixgUfGAbrRlS1St/EcXFXD2MhRkF3CnMYIoeMO
// SIG // MuMyYtxr2sC2B5bDRMUMM/r9I4GP2nowUthCWKFIS1RP
// SIG // lM0YoVfKKMaH7bJii29sW+waBUulAKN2c+Gn5znaiOxR
// SIG // qIu4OL8f9DCHYpME5+Teek3SL95sH5GQhZq7CqTdM0fB
// SIG // w/FmLLx98SpBu7v8XapoTz6jJpyNozhcP/59mi/Fu4tT
// SIG // 2rI2vD50Vx/0GlR9DNZ2py/iyPU7DG/3p1n1zluuRp3u
// SIG // XKjDfVKH7xDbXcMBJid22a3CPbuC2QJLowIDAQABo4IB
// SIG // gjCCAX4wHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFOpuKgJKc+OuNYitoqxfHlrE
// SIG // gXAZMFQGA1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // FjAUBgNVBAUTDTIzMDAxMis1MDI5MjYwHwYDVR0jBBgw
// SIG // FoAUSG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0w
// SIG // SzBJoEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYB
// SIG // BQUHMAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDEx
// SIG // LTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3
// SIG // DQEBCwUAA4ICAQBRaP+hOC1+dSKhbqCr1LIvNEMrRiOQ
// SIG // EkPc7D6QWtM+/IbrYiXesNeeCZHCMf3+6xASuDYQ+AyB
// SIG // TX0YlXSOxGnBLOzgEukBxezbfnhUTTk7YB2/TxMUcuBC
// SIG // P45zMM0CVTaJE8btloB6/3wbFrOhvQHCILx41jTd6kUq
// SIG // 4bIBHah3NG0Q1H/FCCwHRGTjAbyiwq5n/pCTxLz5XYCu
// SIG // 4RTvy/ZJnFXuuwZynowyju90muegCToTOwpHgE6yRcTv
// SIG // Ri16LKCr68Ab8p8QINfFvqWoEwJCXn853rlkpp4k7qzw
// SIG // lBNiZ71uw2pbzjQzrRtNbCFQAfmoTtsHFD2tmZvQIg1Q
// SIG // VkzM/V1KCjHL54ItqKm7Ay4WyvqWK0VIEaTbdMtbMWbF
// SIG // zq2hkRfJTNnFr7RJFeVC/k0DNaab+bpwx5FvCUvkJ3z2
// SIG // wfHWVUckZjEOGmP7cecefrF+rHpif/xW4nJUjMUiPsyD
// SIG // btY2Hq3VMLgovj+qe0pkJgpYQzPukPm7RNhbabFNFvq+
// SIG // kXWBX/z/pyuo9qLZfTb697Vi7vll5s/DBjPtfMpyfpWG
// SIG // 0phVnAI+0mM4gH09LCMJUERZMgu9bbCGVIQR7cT5YhlL
// SIG // t+tpSDtC6XtAzq4PJbKZxFjpB5wk+SRJ1gm87olbfEV9
// SIG // SFdO7iL3jWbjgVi1Qs1iYxBmvh4WhLWr48uouzCCB3ow
// SIG // ggVioAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQEL
// SIG // BQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMT
// SIG // KU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcw
// SIG // ODIxMDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYG
// SIG // A1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0Eg
// SIG // MjAxMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoC
// SIG // ggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
// SIG // uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJ
// SIG // DXlkh36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/X
// SIG // llnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPL
// SIG // bfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5
// SIG // pUkp5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt
// SIG // 7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3
// SIG // Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwP
// SIG // rRkjhMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDgl
// SIG // mDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLE
// SIG // tVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9
// SIG // G9RVS+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/C
// SIG // HFfbg43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kp
// SIG // pxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9A
// SIG // N0/B4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE
// SIG // 2rCIF96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB
// SIG // 6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
// SIG // 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAwe
// SIG // CgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB
// SIG // /wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h
// SIG // 6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDov
// SIG // L2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVj
// SIG // dHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNy
// SIG // bDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCB
// SIG // nwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYI
// SIG // KwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggr
// SIG // BgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABp
// SIG // AGMAeQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkq
// SIG // hkiG9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuW
// SIG // EeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
// SIG // qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS
// SIG // 0LD9a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32m
// SIG // kHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWElj
// SIG // HwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMO
// SIG // r5kol5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsat
// SIG // ruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+n
// SIG // t3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVA
// SIG // KmWjw11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0Hj
// SIG // Wwechz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv
// SIG // 7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3
// SIG // HjXG0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs
// SIG // 6jeZeRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991
// SIG // bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYib
// SIG // V3FWTkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0x
// SIG // ghoiMIIaHgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCDSen2i6WKZWfyx
// SIG // 6Oxn8Gi5w9DQu0OVFPi/4phueQUyoDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAHELrADPgVqdY6opDUmpg36Jc+c4MemU
// SIG // pSOTqQ5T/b00pWUdHl0q6iT0cdzgXA5W6BicjOchuKKZ
// SIG // Y4sG+mDeawKNtXcg+tPLv+zR5jCJCNF+YTBol1Tjrop7
// SIG // Zk/DXECdw3Kp5NSPblsH3K161OKLy4N43a0gC52/gjep
// SIG // 3nieMqmz3b/WAvESEKc1AEMoy0HxGntGFdigTr8gsq5Q
// SIG // 1hlz7XOJhbv1bJjfKOn0Uko+MDJR4aF37Mq6FFaJposx
// SIG // z9MLRoS8WdNGpsxVSPv38xDXeyyXAecfHk1IXeYcoAe9
// SIG // v06ZuXaMgT4VRwV6F96/Qb7xmpaYzbIEzgcM+97ErMpw
// SIG // N3ehghesMIIXqAYKKwYBBAGCNwMDATGCF5gwgheUBgkq
// SIG // hkiG9w0BBwKggheFMIIXgQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWQYLKoZIhvcNAQkQAQSgggFIBIIBRDCCAUAC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // OZX5uv+XiwH2FhXNiha7C67Bcn1hjEMtWgsoze/nMtEC
// SIG // BmbrYQSPTxgSMjAyNDExMDExNjQwMzMuNDNaMASAAgH0
// SIG // oIHZpIHWMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYD
// SIG // VQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25z
// SIG // IExpbWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo1OTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIF
// SIG // EKADAgECAhMzAAAB9BdGhcDLPznlAAEAAAH0MA0GCSqG
// SIG // SIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwMB4XDTI0MDcyNTE4MzA1OVoXDTI1MTAyMjE4MzA1
// SIG // OVowgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsT
// SIG // JE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
// SIG // aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjU5
// SIG // MUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0B
// SIG // AQEFAAOCAg8AMIICCgKCAgEApwhOE6bQgC9qq4jJGX2A
// SIG // 1yoObfk0qetQ8kkj+5m37WBxDlsZ5oJnjfzHspqPiOEV
// SIG // zZ2y2ygGgNZ3/xdZQN7f9A1Wp1Adh5qHXZZh3SBX8ABu
// SIG // c69Tb3cJ5KCZcXDsufwmXeCj81EzJEIZquVdV8STlQue
// SIG // B/b1MIYt5RKis3uwzdlfSl0ckHbGzoO91YTKg6IExqKY
// SIG // ojGreCopnIKxOvkr5VZsj2f95Bb1LGEvuhBIm/C7Jysv
// SIG // JvBZWNtrspzyXVnuo+kDEyZwpkphsR8Zvdi+s/pQiofm
// SIG // dbW1UqzWlqXQVgoYXbaYkEyaSh/heBtwj1tue+LcuOcH
// SIG // APgbwZvQLksKaK46oktregOR4e0icsGiAWR9IL+ny4ml
// SIG // CUNA84F7GEEWOEvibig7wsrTa6ZbzuMsyTi2Az4qPV3Q
// SIG // RkFgxSbp4R4OEKnin8Jz4XLI1wXhBhIpMGfA3BT850nq
// SIG // amzSiD5L5px+VtfCi0MJTS2LDF1PaVZwlyVZIVjVHK8o
// SIG // h2HYG9T26FjR9/I85i5ExxmhHpxM2Z+UhJeZA6Lz452m
// SIG // /+xrA4xrdYas5cm7FUhy24rPLVH+Fy+ZywHAp9c9oWTr
// SIG // tjfIKqLIvYtgJc41Q8WxbZPR7B1uft8BFsvz2dOSLkxP
// SIG // DLcXWy16ANy73v0ipCxAwUEC9hssi0LdB8ThiNf/4A+R
// SIG // Z8sCAwEAAaOCAUkwggFFMB0GA1UdDgQWBBQrdGWhCtEs
// SIG // Pid1LJzsTaLTKQbfmzAfBgNVHSMEGDAWgBSfpxVdAF5i
// SIG // XYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5o
// SIG // dHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2Ny
// SIG // bC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIw
// SIG // MjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsG
// SIG // AQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRpbWUtU3Rh
// SIG // bXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8E
// SIG // AjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4GA1Ud
// SIG // DwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAgEA3cHS
// SIG // DxJKUDsgacIfRX60ugODShsBqwtEURUbUXeDmYYSa5oF
// SIG // j34RujW3gOeCt/ObDO45vfpnYG5OS5YowwsFw19giCI6
// SIG // JV+ccG/qqM08nxASbzwWtqtorzQiJh9upsE4TVZeKYXm
// SIG // byx7WN9tdbVIrCelVj7P6ifMHTSLt6BmyoS2xlC2cfgK
// SIG // PPA13vS3euqUl6zwe7GAhjfjNXjKlE4SNWJvdqgrv0GU
// SIG // RKjqmamNvhmSJane6TYzpdDCegq8adlGH85I1EWKmfER
// SIG // b1lzKy5OMO2e9IkAlvydpUun0C3sNEtp0ehliT0Sraq8
// SIG // jcYVDH4A2C/MbLBIwikjwiFGQ4SlFLT2Tgb4GvvpcWVz
// SIG // BxwDo9IRBwpzngbyzbhh95UVOrQL2rbWHrHDSE3dgdL2
// SIG // yuaHRgY7HYYLs5Lts30wU9Ouh8N54RUta6GFZFx5A4uI
// SIG // TgyJcVdWVaN0qjs0eEjwEyNUv0cRLuHWJBejkMe3qRAh
// SIG // vCjnhro7DGRWaIldyfzZqln6FsnLQ3bl+ZvVJWTYJuL+
// SIG // IZLI2Si3IrIRfjccn29X2BX/vz2KcYubIjK6XfYvrZQN
// SIG // 4XKbnvSqBNAwIPY2xJeB4o9PDEFI2rcPaLUyz5IV7JP3
// SIG // JRpgg3xsUqvFHlSG6uMIWjwH0GQIIwrC2zRy+lNZsOKn
// SIG // ruyyHMQTP7jy5U92qEEwggdxMIIFWaADAgECAhMzAAAA
// SIG // FcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGI
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNy
// SIG // b3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkg
// SIG // MjAxMDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMy
// SIG // MjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIIC
// SIG // IjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGm
// SIG // TOe0ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YB
// SIG // f2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMM
// SIG // tY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTI
// SIG // cVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+
// SIG // NSZk2pg7uhp7M62AW36MEBydUv626GIl3GoPz130/o5T
// SIG // z9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi9
// SIG // 47SHJMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uD
// SIG // RedGbsoy1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tn
// SIG // YN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/Nme
// SIG // Rd+2ci/bfV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03
// SIG // dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5
// SIG // TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy
// SIG // 16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkL
// SIG // iWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXps
// SIG // xREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqP
// SIG // nhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsG
// SIG // AQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqn
// SIG // Uv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVd
// SIG // AF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsG
// SIG // AQQBgjdMg30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVw
// SIG // b3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgw
// SIG // GQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0P
// SIG // BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgw
// SIG // FoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8w
// SIG // TTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29t
// SIG // L3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIw
// SIG // MTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
// SIG // BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0y
// SIG // My5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEs
// SIG // H2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfC
// SIG // cTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2Y
// SIG // urYeeNg2LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/
// SIG // SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRW
// SIG // qveVtihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wX
// SIG // sFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixr
// SIG // e24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoy
// SIG // GtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8
// SIG // x1RtnWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk
// SIG // 2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pF
// SIG // EUep8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq7
// SIG // 7EFmPWn9y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGC
// SIG // onsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1Zyvg
// SIG // DbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7
// SIG // vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0
// SIG // HVUzWLOhcGbyoYIDVjCCAj4CAQEwggEBoYHZpIHWMIHT
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNy
// SIG // b3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQx
// SIG // JzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo1OTFBLTA1
// SIG // RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUAv+LZ
// SIG // /Vg0s17Xek4iG9R9c/7+AI6ggYMwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsF
// SIG // AAIFAOrPNc4wIhgPMjAyNDExMDExMTExMTBaGA8yMDI0
// SIG // MTEwMjExMTExMFowdDA6BgorBgEEAYRZCgQBMSwwKjAK
// SIG // AgUA6s81zgIBADAHAgEAAgISKDAHAgEAAgITezAKAgUA
// SIG // 6tCHTgIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEE
// SIG // AYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0G
// SIG // CSqGSIb3DQEBCwUAA4IBAQCbuFnbxY0xbj+GPbuTdYHZ
// SIG // l4s9LOjeIGYjTEdcbPym8G3HFlCTjhc0/2oi8DRKNwYL
// SIG // SRlU2B0vpGSnOZTnreY7rzTnop4HX2gqOsNFPtLPZ9bx
// SIG // k655hC33l3A3fBCo+gM7707+OKcDKdtyR1UNAN8Kqsur
// SIG // 5Om3sdg3YNObbWxzFFMsIY4idtW/AG2Go/+V2wd5RwuM
// SIG // jiMLLKKbsYVnCRyWpi2bDm7k6LhSBEGQJ0g+M8AtNV4i
// SIG // tIioVbl7C1OZdh+X+bCRRZ7ZJI6pa3MXjamAuUwZGI1Z
// SIG // RZhi3kw1IbipUHX8hAykBLccq7ux54g4vxWkW40mklil
// SIG // 4wUQf1SQLyX8MYIEDTCCBAkCAQEwgZMwfDELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgUENBIDIwMTACEzMAAAH0F0aFwMs/OeUA
// SIG // AQAAAfQwDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3
// SIG // DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQx
// SIG // IgQg6OQcdQXnTfrCQ+HJ/V/EhATVoHMxn9mnpeBzL/9v
// SIG // 548wgfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCA/
// SIG // WMJ8biaT6njvkknB8Q7hSQIi8ys6vIBvZg60RBjWazCB
// SIG // mDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
// SIG // BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
// SIG // AhMzAAAB9BdGhcDLPznlAAEAAAH0MCIEIMhkEo/fFznP
// SIG // QATQ4VPPXyUO1qYEug0RwKROWHge9EZTMA0GCSqGSIb3
// SIG // DQEBCwUABIICAEkKcSY1nPfilxJub6MfhyjzXpEtqOVt
// SIG // sUkk6TFlCGs+1Ij+ljqcBL1Hh4A3JRNPKY+vXkFGhZDL
// SIG // ENA7UjtHGWBFMV0bmvKN2t0eCjmEGCKY5MPciEm8aWJe
// SIG // e8EJzSrM9YfiDii+wAcBW2Qq8ozFo5qQS3RWo+JEhYTc
// SIG // zimL6Ec36tI6HH37FqJBclVLDcLKyQRuSFNs0W/hvShb
// SIG // LRqkwEEM0bbJuKTQMcWePAsVStqOm9NjlEnv6q637CxA
// SIG // /CqGSef5lBPTb8muwWZ17KJFQpGgrKUBmaDXvjTXoxqo
// SIG // QZnix7t8mt+dCOkU8Szu7sG/7v6iM6Juf1oQNLmlozoL
// SIG // UUEgrNYTaGsJaZyx3DJ3EXR+CLhVV2XxsyLW8pEROuvD
// SIG // r82vZTpNrwLHnOhcqyfh19mJx9NB3JVvLiHQStSwD3Ii
// SIG // iyQNsr7r5EBSnZnSrAEFkRyLoiVu5uF4wJlOh0WJJF6W
// SIG // bZXlQ3I+/sFbDU1ar3X7/x0Js9kCWtXIj548ZRY96B1C
// SIG // eeEldrm4fy3aeJv2H58q8TivKkuIkYCP4rR89r/U/WwW
// SIG // e73DNI5ms3z861iF3/DeOjLglAZBQHVK7KB/zQ5SnEGg
// SIG // sznaiunLMZrHud1s4kG/2nBlo5kgopb607I7UngYNSrb
// SIG // lOcSa8VM//Zo4nUEHhhfKl8k/8CjsctSmQtQ
// SIG // End signature block
