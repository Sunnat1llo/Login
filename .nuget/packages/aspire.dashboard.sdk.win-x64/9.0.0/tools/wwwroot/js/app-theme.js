import {
    accentBaseColor,
    baseLayerLuminance,
    SwatchRGB,
    fillColor,
    neutralLayerL2,
    neutralPalette,
    DesignToken,
    neutralFillLayerRestDelta
} from "/_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js";

const currentThemeCookieName = "currentTheme";
const themeSettingDark = "Dark";
const themeSettingLight = "Light";
const darkThemeLuminance = 0.19;
const lightThemeLuminance = 1.0;
const darknessLuminanceTarget = (-0.1 + Math.sqrt(0.21)) / 2;

/**
 * Updates the current theme on the site based on the specified theme
 * @param {string} specifiedTheme
 */
export function updateTheme(specifiedTheme) {
    const effectiveTheme = getEffectiveTheme(specifiedTheme);

    applyTheme(effectiveTheme);
    setThemeCookie(specifiedTheme);

    return effectiveTheme;
}

/**
 * Returns the value of the currentTheme cookie.
 * @returns {string}
 */
export function getThemeCookieValue() {
    return getCookieValue(currentThemeCookieName);
}

export function getCurrentTheme() {
    return getEffectiveTheme(getThemeCookieValue());
}

/**
 * Returns the current system theme (Light or Dark)
 * @returns {string}
 */
function getSystemTheme() {
    let matched = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (matched) {
        return themeSettingDark;
    } else {
        return themeSettingLight;
    }
}

/**
 * Sets the currentTheme cookie to the specified value.
 * @param {string} theme
 */
function setThemeCookie(theme) {
    if (theme == themeSettingDark || theme == themeSettingLight) {
        // Cookie will expire after 1 year. Using a much larger value won't have an impact because
        // Chrome limits expiration to 400 days: https://developer.chrome.com/blog/cookie-max-age-expires
        // The cookie is reset when the dashboard loads to creating a sliding expiration.
        document.cookie = `${currentThemeCookieName}=${theme}; Path=/; expires=${new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365).toGMTString()}`;
    } else {
        // Delete cookie for other values (e.g. System)
        document.cookie = `${currentThemeCookieName}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    }
}

/**
 * Sets the document data-theme attribute to the specified value.
 * @param {string} theme The theme to set. Should be Light or Dark.
 */
function setThemeOnDocument(theme) {

    if (theme === themeSettingDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else /* Light */ {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

/**
 *
 * @param {string} theme The theme to use. Should be Light or Dark.
 */
function setBaseLayerLuminance(theme) {
    const baseLayerLuminanceValue = getBaseLayerLuminanceForTheme(theme);
    baseLayerLuminance.withDefault(baseLayerLuminanceValue);
}

/**
 * Returns the value of the specified cookie, or the empty string if the cookie is not present
 * @param {string} cookieName
 * @returns {string}
 */
function getCookieValue(cookieName) {
    const cookiePieces = document.cookie.split(';');
    for (let index = 0; index < cookiePieces.length; index++) {
        if (cookiePieces[index].trim().startsWith(cookieName)) {
            const cookieKeyValue = cookiePieces[index].split('=');
            if (cookieKeyValue.length > 1) {
                return cookieKeyValue[1];
            }
        }
    }

    return "";
}

/**
 * Converts a setting value for the theme (Light, Dark, System or null/empty) into the effective theme that should be applied
 * @param {string} specifiedTheme The setting value to use to determine the effective theme. Anything other than Light or Dark will be treated as System
 * @returns {string} The actual theme to use based on the supplied setting. Will be either Light or Dark.
 */
function getEffectiveTheme(specifiedTheme) {
    if (specifiedTheme === themeSettingLight ||
        specifiedTheme === themeSettingDark) {
        return specifiedTheme;
    } else {
        return getSystemTheme();
    }
}

/**
 *
 * @param {string} theme The theme to use. Should be Light or Dark
 * @returns {string}
 */
function getBaseLayerLuminanceForTheme(theme) {
    if (theme === themeSettingDark) {
        return darkThemeLuminance;
    } else /* Light */ {
        return lightThemeLuminance;
    }
}

/**
 * Configures the accent color palette based on the .NET purple
 */
function setAccentColor() {
    // Convert the base color ourselves to avoid pulling in the
    // @microsoft/fast-colors library just for one call to parseColorHexRGB
    const baseColor = { // #512BD4
        r: 0x51 / 255.0,
        g: 0x2B / 255.0,
        b: 0xD4 / 255.0
    };

    const accentBase = SwatchRGB.create(baseColor.r, baseColor.g, baseColor.b);
    accentBaseColor.withDefault(accentBase);
}

/**
 * Configures the default background color to use for the body
 */
function setFillColor() {
    // Design specs say we should use --neutral-layer-2 as the fill color
    // for the body. Most of the web components use --fill-color as their
    // background color, so we need to make sure they get --neutral-layer-2
    // when they request --fill-color.
    fillColor.setValueFor(document.body, neutralLayerL2);
}

/**
 * Applies the Light or Dark theme to the entire site
 * @param {string} theme The theme to use. Should be Light or Dark
 */
function applyTheme(theme) {
    setBaseLayerLuminance(theme);
    setAccentColor();
    setFillColor();
    setThemeOnDocument(theme);
}

/**
 *
 * @param {Palette} palette
 * @param {number} baseLayerLuminance
 * @returns {number}
 */
function neutralLayer1Index(palette, baseLayerLuminance) {
    return palette.closestIndexOf(SwatchRGB.create(baseLayerLuminance, baseLayerLuminance, baseLayerLuminance));
}

/**
 *
 * @param {Palette} palette
 * @param {Swatch} reference
 * @param {number} baseLayerLuminance
 * @param {number} layerDelta
 * @param {number} hoverDeltaLight
 * @param {number} hoverDeltaDark
 * @returns {Swatch}
 */
function neutralLayerHoverAlgorithm(palette, reference, baseLayerLuminance, layerDelta, hoverDeltaLight, hoverDeltaDark) {
    const baseIndex = neutralLayer1Index(palette, baseLayerLuminance);
    // Determine both the size of the delta (from the value passed in) and the direction (if the current color is dark,
    // the hover color will be a lower index (lighter); if the current color is light, the hover color will be a higher index (darker))
    const hoverDelta = isDark(reference) ? hoverDeltaDark * -1 : hoverDeltaLight;
    return palette.get(baseIndex + (layerDelta * -1) + hoverDelta);
}

/**
 *
 * @param {Swatch} color
 * @returns {boolean}
 */
function isDark(color) {
    return color.relativeLuminance <= darknessLuminanceTarget;
}

/**
 * Creates additional design tokens that are used to define the hover colors for the neutral layers
 * used in the site theme (neutral-layer-1 and neutral-layer-2, specifically). Unlike other -hover
 * variants, these are not created by the design system by default so we need to create them ourselves.
 * This is a lightly tweaked variant of other hover recipes used in the design system.
 */
function createAdditionalDesignTokens() {
    const neutralLayer1HoverLightDelta = DesignToken.create({ name: 'neutral-layer-1-hover-light-delta', cssCustomPropertyName: null }).withDefault(3);
    const neutralLayer1HoverDarkDelta = DesignToken.create({ name: 'neutral-layer-1-hover-dark-delta', cssCustomPropertyName: null }).withDefault(2);
    const neutralLayer2HoverLightDelta = DesignToken.create({ name: 'neutral-layer-2-hover-light-delta', cssCustomPropertyName: null }).withDefault(2);
    const neutralLayer2HoverDarkDelta = DesignToken.create({ name: 'neutral-layer-2-hover-dark-delta', cssCustomPropertyName: null }).withDefault(2);

    const neutralLayer1HoverRecipe = DesignToken.create({ name: 'neutral-layer-1-hover-recipe', cssCustomPropertyName: null }).withDefault({
        evaluate: (element, reference) =>
            neutralLayerHoverAlgorithm(
                neutralPalette.getValueFor(element),
                reference || fillColor.getValueFor(element),
                baseLayerLuminance.getValueFor(element),
                0, // No layer delta since this is for neutral-layer-1
                neutralLayer1HoverLightDelta.getValueFor(element),
                neutralLayer1HoverDarkDelta.getValueFor(element)
            ),
    });

    const neutralLayer2HoverRecipe = DesignToken.create({ name: 'neutral-layer-2-hover-recipe', cssCustomPropertyName: null }).withDefault({
        evaluate: (element, reference) =>
            neutralLayerHoverAlgorithm(
                neutralPalette.getValueFor(element),
                reference || fillColor.getValueFor(element),
                baseLayerLuminance.getValueFor(element),
                // Use the same layer delta used by the base recipe to calculate layer 2
                neutralFillLayerRestDelta.getValueFor(element),
                neutralLayer2HoverLightDelta.getValueFor(element),
                neutralLayer2HoverDarkDelta.getValueFor(element)
            ),
    });

    // Creates the --neutral-layer-1-hover custom CSS property
    DesignToken.create('neutral-layer-1-hover').withDefault((element) =>
        neutralLayer1HoverRecipe.getValueFor(element).evaluate(element),
    );

    // Creates the --neutral-layer-2-hover custom CSS property
    DesignToken.create('neutral-layer-2-hover').withDefault((element) =>
        neutralLayer2HoverRecipe.getValueFor(element).evaluate(element),
    );
}

function initializeTheme() {
    const themeCookieValue = getThemeCookieValue();
    const effectiveTheme = getEffectiveTheme(themeCookieValue);

    applyTheme(effectiveTheme);

    // If a theme cookie has been set then set it again on page load.
    // This updates the cookie expiration date and creates a sliding expiration.
    if (themeCookieValue) {
        setThemeCookie(themeCookieValue);
    }
}

createAdditionalDesignTokens();
initializeTheme();

// SIG // Begin signature block
// SIG // MIIoUwYJKoZIhvcNAQcCoIIoRDCCKEACAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // H62Soy6hZVgzSGaIDoEyXA7yxRSCf/pqy3RBS9anIlyg
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
// SIG // ghomMIIaIgIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDExAhMzAAAEA73VlV0POxitAAAAAAQDMA0G
// SIG // CWCGSAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgor
// SIG // BgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEE
// SIG // AYI3AgEVMC8GCSqGSIb3DQEJBDEiBCAqPHR8kNOSbEPO
// SIG // JVRru6pXhXXxJhuWp3V2+nwuybEkZDBCBgorBgEEAYI3
// SIG // AgEMMTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAY
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3
// SIG // DQEBAQUABIIBAA6MYy28OhKxQLSMITO2QlaFspIYBKCe
// SIG // ECBO6I9HU7bf0+YFHHWrZ7siu4O3V8uYyE0x2wQllNC+
// SIG // jSBOrx8V8/mj8u58heaS2Ywurtdklz1AFWIkBFJolpVV
// SIG // OhhcNiGPDLASVhE0oUNCB8YNtQUW/pgBiKAf1U5dYFxu
// SIG // ROpwiCdsRs9r/uXI0YtdMJ8uOq2KWGy+g9Gw/LWVq+Q1
// SIG // dY9aTCKYRoclQHZuYYS8OyyIY471akC4Gp129n4O0xIx
// SIG // n1GUFYSpMXYINw7V/jsVU6Kkgr9i1mvxB7azvZMLC4FW
// SIG // 6lLpyVPjdXTCRWJYKIfTQsMo+iHnSwIUWkU6qhAWwmJP
// SIG // jSyhghewMIIXrAYKKwYBBAGCNwMDATGCF5wwgheYBgkq
// SIG // hkiG9w0BBwKggheJMIIXhQIBAzEPMA0GCWCGSAFlAwQC
// SIG // AQUAMIIBWgYLKoZIhvcNAQkQAQSgggFJBIIBRTCCAUEC
// SIG // AQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEFAAQg
// SIG // 0C28gUaqHN7kMmymUAxAdtJcX2m+VpuTcxB0wY+7WwYC
// SIG // BmbraT6XaxgTMjAyNDExMDExNjQwMzQuMzM1WjAEgAIB
// SIG // 9KCB2aSB1jCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsG
// SIG // A1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9u
// SIG // cyBMaW1pdGVkMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBF
// SIG // U046NTcxQS0wNUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFNlcnZpY2WgghH+MIIHKDCC
// SIG // BRCgAwIBAgITMwAAAfvLy2w3Z+UwlQABAAAB+zANBgkq
// SIG // hkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMDAeFw0yNDA3MjUxODMxMTNaFw0yNTEwMjIxODMx
// SIG // MTNaMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQL
// SIG // EyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExp
// SIG // bWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo1
// SIG // NzFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCAiIwDQYJKoZIhvcN
// SIG // AQEBBQADggIPADCCAgoCggIBAKjCVkHlgKuC8L0o2LIz
// SIG // 9FL4b5tI9GgDiYjC4NLC38SqE1wHSg+qDLquaxeaBIjs
// SIG // VfvaMdB/eUPH4aGat8fZcYLmckziuJdsbXILSQrY10ZZ
// SIG // TNm06YzoN+UVKwctHAJaAVPRiQbOywTa3Gx+qwYjr6g0
// SIG // DYnD0WcKtescozInVNSdQCbmrfci5+7Won6A+fG5WBHA
// SIG // b5I+XR9ZWvc1POOkA3jqETujXKhy7A8fP81SmcT99Jlu
// SIG // mO0TLKrQfHBgoBsFVbqzp2jS17N9ak0U8lR1/KaTnaEo
// SIG // oQl3qnm4CQkcxvMxv3v5NKGgYxRRpfvLhRC8AsoeMCvW
// SIG // efms0832thg+KeoobbJF7N5Z1tOVCnwyYQAA7er4jnNE
// SIG // ZP3PMzoqs4dJSqX/3llGNqP4b3Az2TYC2h78nw6m/AFm
// SIG // irzt+okWUl6oUsPEsSaNEwqbGwo5rcdC6R56m29VBe3K
// SIG // tPZAnH1kwz3DddqW2C6nJNGyCHzym3Ox565DUJLP5km1
// SIG // WU5w8k9zvMxfauAwn1nrEq9WpMnA3bhsQnSgb4LSYdWM
// SIG // Q6tbJE8HmMeYgFl5weyjMpbN1kGW07m0wiy7fF5/LfrJ
// SIG // XCpuQ5L6G7m5h0q4rkwN8E8iMuBcWpkyptFQ7vZlnbPD
// SIG // LY1EiVcDVVZQV2kN2THFY4o8laFDVbgWPTHMGHCECuts
// SIG // ENtBAgMBAAGjggFJMIIBRTAdBgNVHQ4EFgQUR1UhmFDU
// SIG // N0cDpe9cyALlIyCoNSowHwYDVR0jBBgwFoAUn6cVXQBe
// SIG // Yl2D9OXSZacbUzUZ6XIwXwYDVR0fBFgwVjBUoFKgUIZO
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUy
// SIG // MDIwMTAoMSkuY3JsMGwGCCsGAQUFBwEBBGAwXjBcBggr
// SIG // BgEFBQcwAoZQaHR0cDovL3d3dy5taWNyb3NvZnQuY29t
// SIG // L3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQlMjBUaW1lLVN0
// SIG // YW1wJTIwUENBJTIwMjAxMCgxKS5jcnQwDAYDVR0TAQH/
// SIG // BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDCDAOBgNV
// SIG // HQ8BAf8EBAMCB4AwDQYJKoZIhvcNAQELBQADggIBAMM6
// SIG // CCjmNnZ1I31rjIhqM/6L6HNXvOlcFmmTRXYEZjqELkXu
// SIG // Jy3bWTjbUxzZN0o955MgbM88Um2RENA3bsihxyOT/FfO
// SIG // 4xbbRp5UdMDz9thQHm27wG7rZDDFUDBc4VQVolg9FQJ7
// SIG // vcdH44nyygwFVy8KLp+awhasG2rFxXOx/9Az4gvgwZ97
// SIG // VMXn73MVAsrOPgwt7PAmKe1ll6WfFm/73QYQ5Yh5ge6V
// SIG // nJrAfN7nOPz9hpgCNxzJDhLu3wmkmKEIaLljq9O5fyjO
// SIG // E53cpSIq5vH9lsF0HBRM5lLyEjOpbnVMBpVTX00yVKtm
// SIG // 0wxHd7ZQyrVfQFGN665xcB08Ca8i7U+CBYb4AXzQ95i9
// SIG // XnkmpCn+8UyCOCcrdeUl4R3eaCP1xo0oMpICa1gOe6xp
// SIG // wAu67t/2WxTQjCvyY+l/F+C+pgTmGtjRisB+AN+2Bg63
// SIG // nCf6l11lGL3y2Khxn/E4WJddmINa8EiqVi6JQPwdXqgc
// SIG // OE0XL1WNCLzTYubJvv/xyfQMOjSbkf7g0e1+7w14nKVz
// SIG // JUTYBTMgA2/ABSL0D3R6nEaUaK2PmFBpb83icf9oDWMn
// SIG // swKJG6xYQArCdgX8ni8ghKOgLsBB5+ddTyhPHSuCb5Zi
// SIG // 0qB4+1RUdzRw5N80ZMdBMZJhfGjnab6CobsAQsaGfyYW
// SIG // 80s672e+BlYyiiMreRQNMIIHcTCCBVmgAwIBAgITMwAA
// SIG // ABXF52ueAptJmQAAAAAAFTANBgkqhkiG9w0BAQsFADCB
// SIG // iDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWlj
// SIG // cm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5
// SIG // IDIwMTAwHhcNMjEwOTMwMTgyMjI1WhcNMzAwOTMwMTgz
// SIG // MjI1WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCC
// SIG // AiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAOTh
// SIG // pkzntHIhC3miy9ckeb0O1YLT/e6cBwfSqWxOdcjKNVf2
// SIG // AX9sSuDivbk+F2Az/1xPx2b3lVNxWuJ+Slr+uDZnhUYj
// SIG // DLWNE893MsAQGOhgfWpSg0S3po5GawcU88V29YZQ3MFE
// SIG // yHFcUTE3oAo4bo3t1w/YJlN8OWECesSq/XJprx2rrPY2
// SIG // vjUmZNqYO7oaezOtgFt+jBAcnVL+tuhiJdxqD89d9P6O
// SIG // U8/W7IVWTe/dvI2k45GPsjksUZzpcGkNyjYtcI4xyDUo
// SIG // veO0hyTD4MmPfrVUj9z6BVWYbWg7mka97aSueik3rMvr
// SIG // g0XnRm7KMtXAhjBcTyziYrLNueKNiOSWrAFKu75xqRdb
// SIG // Z2De+JKRHh09/SDPc31BmkZ1zcRfNN0Sidb9pSB9fvzZ
// SIG // nkXftnIv231fgLrbqn427DZM9ituqBJR6L8FA6PRc6ZN
// SIG // N3SUHDSCD/AQ8rdHGO2n6Jl8P0zbr17C89XYcz1DTsEz
// SIG // OUyOArxCaC4Q6oRRRuLRvWoYWmEBc8pnol7XKHYC4jMY
// SIG // ctenIPDC+hIK12NvDMk2ZItboKaDIV1fMHSRlJTYuVD5
// SIG // C4lh8zYGNRiER9vcG9H9stQcxWv2XFJRXRLbJbqvUAV6
// SIG // bMURHXLvjflSxIUXk8A8FdsaN8cIFRg/eKtFtvUeh17a
// SIG // j54WcmnGrnu3tz5q4i6tAgMBAAGjggHdMIIB2TASBgkr
// SIG // BgEEAYI3FQEEBQIDAQABMCMGCSsGAQQBgjcVAgQWBBQq
// SIG // p1L+ZMSavoKRPEY1Kc8Q/y8E7jAdBgNVHQ4EFgQUn6cV
// SIG // XQBeYl2D9OXSZacbUzUZ6XIwXAYDVR0gBFUwUzBRBgwr
// SIG // BgEEAYI3TIN9AQEwQTA/BggrBgEFBQcCARYzaHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9Eb2NzL1Jl
// SIG // cG9zaXRvcnkuaHRtMBMGA1UdJQQMMAoGCCsGAQUFBwMI
// SIG // MBkGCSsGAQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1Ud
// SIG // DwQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQY
// SIG // MBaAFNX2VsuP6KJcYmjRPZSQW9fOmhjEMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jvb0NlckF1dF8y
// SIG // MDEwLTA2LTIzLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCdVX38Kq3h
// SIG // LB9nATEkW+Geckv8qW/qXBS2Pk5HZHixBpOXPTEztTnX
// SIG // wnE2P9pkbHzQdTltuw8x5MKP+2zRoZQYIu7pZmc6U03d
// SIG // mLq2HnjYNi6cqYJWAAOwBb6J6Gngugnue99qb74py27Y
// SIG // P0h1AdkY3m2CDPVtI1TkeFN1JFe53Z/zjj3G82jfZfak
// SIG // Vqr3lbYoVSfQJL1AoL8ZthISEV09J+BAljis9/kpicO8
// SIG // F7BUhUKz/AyeixmJ5/ALaoHCgRlCGVJ1ijbCHcNhcy4s
// SIG // a3tuPywJeBTpkbKpW99Jo3QMvOyRgNI95ko+ZjtPu4b6
// SIG // MhrZlvSP9pEB9s7GdP32THJvEKt1MMU0sHrYUP4KWN1A
// SIG // PMdUbZ1jdEgssU5HLcEUBHG/ZPkkvnNtyo4JvbMBV0lU
// SIG // ZNlz138eW0QBjloZkWsNn6Qo3GcZKCS6OEuabvshVGtq
// SIG // RRFHqfG3rsjoiV5PndLQTHa1V1QJsWkBRH58oWFsc/4K
// SIG // u+xBZj1p/cvBQUl+fpO+y/g75LcVv7TOPqUxUYS8vwLB
// SIG // gqJ7Fx0ViY1w/ue10CgaiQuPNtq6TPmb/wrpNPgkNWcr
// SIG // 4A245oyZ1uEi6vAnQj0llOZ0dFtq0Z4+7X6gMTN9vMvp
// SIG // e784cETRkPHIqzqKOghif9lwY1NNje6CbaUFEMFxBmoQ
// SIG // tB1VM1izoXBm8qGCA1kwggJBAgEBMIIBAaGB2aSB1jCB
// SIG // 0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEtMCsGA1UECxMkTWlj
// SIG // cm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVk
// SIG // MScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NTcxQS0w
// SIG // NUUwLUQ5NDcxJTAjBgNVBAMTHE1pY3Jvc29mdCBUaW1l
// SIG // LVN0YW1wIFNlcnZpY2WiIwoBATAHBgUrDgMCGgMVAARx
// SIG // 5+zQhrrGc9kX1W8rsGMD8pAVoIGDMIGApH4wfDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgUENBIDIwMTAwDQYJKoZIhvcNAQEL
// SIG // BQACBQDqzz4LMCIYDzIwMjQxMTAxMTE0NjE5WhgPMjAy
// SIG // NDExMDIxMTQ2MTlaMHcwPQYKKwYBBAGEWQoEATEvMC0w
// SIG // CgIFAOrPPgsCAQAwCgIBAAICMbICAf8wBwIBAAICE9Yw
// SIG // CgIFAOrQj4sCAQAwNgYKKwYBBAGEWQoEAjEoMCYwDAYK
// SIG // KwYBBAGEWQoDAqAKMAgCAQACAwehIKEKMAgCAQACAwGG
// SIG // oDANBgkqhkiG9w0BAQsFAAOCAQEAdy0o/uP0GCs1yZwi
// SIG // evTFTsczReBWgSpArGeiou2AidpUTzqAhLmUuk29xMPa
// SIG // mnIHTvskNHFrTnOE0wu8nehwPOf9goHazQecN7isX2ls
// SIG // JnAvy8FFG0XJN9JXi0BCAduJVUtwAFjXXt20aO6wVW2U
// SIG // 19eFY1K0gd7YmKxqJ6Oax/0yimZSC9cWCkCVBKWcLraK
// SIG // eJvDrQYCoLvZ5TJcnDBthhTIk10mqdJ+jLkKjopzoMBv
// SIG // K8pSCpbOpLlqqUFz3nFtzM8xA+iNwXU/GJO2eTqLa65x
// SIG // rpPSWdXRt/nVvuVy4PtvlmPnHx5bTC9pqPrumUss10Uj
// SIG // A1usnBboS7QIE1hifTGCBA0wggQJAgEBMIGTMHwxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
// SIG // dCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAB+8vLbDdn
// SIG // 5TCVAAEAAAH7MA0GCWCGSAFlAwQCAQUAoIIBSjAaBgkq
// SIG // hkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZIhvcN
// SIG // AQkEMSIEIPj76IIiYUjqHVkw2Xc9kzE3KEP74BXe2MzP
// SIG // ejfZG8uYMIH6BgsqhkiG9w0BCRACLzGB6jCB5zCB5DCB
// SIG // vQQgOdsCq/yghZVTWIlrAi7AeKoYxGBD98R6mKg7tUkk
// SIG // 5RgwgZgwgYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYw
// SIG // JAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0Eg
// SIG // MjAxMAITMwAAAfvLy2w3Z+UwlQABAAAB+zAiBCBP/uni
// SIG // KVDlAvHBwoK5gLFI/a5TDBij3fO2Jlu+UEPD2zANBgkq
// SIG // hkiG9w0BAQsFAASCAgAfsnidTglRRvKSQVmRL+fU38r5
// SIG // mKF89H4LnCRTKFSJSbVlP2LJWJ325fwGpFEkcGG8IPw7
// SIG // V8z/CYJ7mCNCNJ6AK+JwB7YuGO3//YUtlA4qer78lXVM
// SIG // JHPn8WzFd3PaMZ8qU5bib4lBTygpCR0m/qW5E9yH3LJe
// SIG // b2GdTZFBF4stJWrIVeOfE2ukVAa4PQ2SVX+DDmuRsRaH
// SIG // +F/BrhPq2KwKAmUe4DYE0nz3GPeMcudD/ENGPI4R3nvb
// SIG // 4jeyGL0mh1l8IZ3hZ/6+MkaQRE1BWJ/Uw95uTrVdnl6D
// SIG // BBIsSCYfvb/XwRpA8MR5/x/Ox9BFbyFx/u37wbs76XUo
// SIG // m+aMyB8HTkvFwh6K92TzWdnL2hz7V3haa2AUiVOIUyAE
// SIG // J7G6XQtZ+D7mMpfy5CNoH2C+ofFgEqBY4bXVB//WhefI
// SIG // 5T/WhlVPzVmku9G6+MO30cauoDcZrE6F5KbPxnr50+bs
// SIG // T5IW8BQeYcIxdUldiFbjsl4h+3eq5OIipZ6FZufCOya/
// SIG // yoJQNf6buxHXV23ON9saT1dzQq3LRwdpeinUw5TWoz0t
// SIG // /YpEFp7UMzcjHAtyKeWG3vJXIPRugK8BNk/a6sTJACj9
// SIG // JjBmC8HrJbr5G7mgnS5Efzc4sZ6YGgtL9yKx3SFLVlAd
// SIG // SrJFULx0IHb0ve5cv98x8WLtCqNRxmSytUtUuwzXAg==
// SIG // End signature block
