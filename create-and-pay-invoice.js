// ==UserScript==
// @name         Alegra
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add Invoice and Pay to default account
// @author       Nicolas Mesa
// @match        https://app.alegra.com/invoice/add
// @grant        none
// @require      https://code.jquery.com/jquery-1.12.4.min.js
// ==/UserScript==

$(document).ready(function() {
    var paymentConfig = {
        idAccount: 1,
        paymentMethod: 'cash',
        currency: 'COP',
        thousandsSeparator: ','
    };

    var session = (new Date()).getTime();
    var btnHolderCmp = getButtonsHolderCmp();
    var saveButtonHtml = btnHolderCmp.down('#invoiceSaveInvoiceButton').el.dom;

    var btn = Ext.create('Ext.button.Button', {text: 'Guardar y pagar', height: 38, style: {marginLeft: '20px'}});
    btn.on('click', function() {
        var triggered = false;
        Ext.Ajax.tamperRequest = Ext.Ajax.request;

        setTimeout(function() {
            if (triggered) {
                return;
            }
            Ext.Ajax.request = Ext.Ajax.tamperRequest;
            delete(Ext.Ajax.tamperRequest);
        }, 100);

        Ext.Ajax.request = function(request) {
            var originalSuccess = request.success;
            console.log('original request', request);

            request.success = function(response) {
                var responseText = Ext.decode(response.responseText);

                if (!responseText.success) {
                    originalSuccess(response);
                    return;
                }

                makePayment(paymentConfig, responseText.results, originalSuccess, response);
            };

            Ext.Ajax.tamperRequest(request);

            // set triggered to true to avoid Ext.Ajax.request from being set to undefined
            triggered = true;
            Ext.Ajax.request = Ext.Ajax.tamperRequest;
            delete(Ext.Ajax.tamperRequest);
        };

        $(saveButtonHtml).trigger('click');
    });

    btnHolderCmp.insert(1, btn);
});

function getButtonsHolderCmp() {
    var buttonsHolderId = Ext.select('#buttonsHolder > div').elements[0].id;
    var buttonsHolderCmp = Ext.getCmp(buttonsHolderId);
    return buttonsHolderCmp;
}

function makePayment(paymentConfig, invoiceId, originalSuccess, originalResponse) {
    var invoicePayment = {
        invoiceIdLocal: invoiceId,
        number: 'nothin',
        amount: getInvoiceTotalAmount(paymentConfig.thousandsSeparator),
        retentions: []
    };

    var emptyJSONArray = Ext.encode([]);

    var params = {
        idTransaction: '',
        idClient: getIdClient(),
        idAccount: paymentConfig.idAccount,
        date: getInvoiceDate(),
        paymentMethod: paymentConfig.paymentMethod,
        currency: paymentConfig.currency,
        invoices: Ext.encode([invoicePayment]),
        exchangeCurrency: '',
        observations: '',
        anotation: '',
        retentions: emptyJSONArray,
        bills: emptyJSONArray,
        categories: emptyJSONArray
    };

    console.log(params);

    Ext.Ajax.request({
        url: '/transaction/in/format/json',
        method: 'post',
        params: params,

        success: function(response) {
            console.log(response);
            var responseText = Ext.decode(response.responseText);

            if (responseText.success) {
                console.log('success');
                originalSuccess(originalResponse);
                return;
            }

            console.log('Failure');
            originalSuccess(originalResponse);
        }
    });
}

function getIdClient() {
    var combo = Ext.getCmp('invoiceClientCombo');
    return combo.getValue();
}

function getInvoiceDate() {
    var invoiceDateField = Ext.getCmp('invoiceDateDateField');
    return invoiceDateField.getSubmitValue();
}

function getInvoiceTotalAmount(thousandsSeparator) {
    var totalContainer = $('#totalContainer table.x-field:last-child tr:last-child div.x-form-display-field');
    return totalContainer.text().replace(thousandsSeparator, "").replace('$', "");
}
