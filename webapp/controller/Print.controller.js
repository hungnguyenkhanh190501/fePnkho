sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/Fragment",
        "sap/ui/model/odata/v2/ODataModel",
        "sap/m/MessageBox",
        "sap/m/MessageToast"
    ],
    function (Controller, Fragment, ODataModel, MessageBox, MessageToast) {
        "use strict";
        return {
            busyDialog: null,
            onInitSmartFilterBarExtension: function(oSource) {
                console.log('onInitSmartFilterBarExtension')
                var filterObject = this.getView().byId("listReportFilter")
                console.log(filterObject)
                 let defaultValue = {
                 "MaterialDocumentYear": new Date().getFullYear().toString(),
                 "PlannedGoodsIssueDate": new Date()
                }
                 filterObject.setFilterData(defaultValue)
            }, 
            Print: async function (oEvent) {
                let thisController = this
                MessageBox.information("Bạn có muốn tải xuống?", {
                    actions: ["Tải ngay", "Xem trước", "Huỷ"],
                    emphasizedAction: "Tải ngay",
                    // initialFocus: MessageBox.Action.PREVIEW,
                    onClose: async function (sAction) {
                        if (sAction == "Tải ngay") {
                            let aContexts = thisController.extensionAPI.getSelectedContexts();
                            console.log(aContexts.length);
                            const dateNow = new Date();
                            const VND = new Intl.NumberFormat('en-DE');
                            if (!thisController.busyDialog) {
                                Fragment.load({
                                    id: "idBusyDialog",
                                    name: "zpnkho.controller.fragment.Busy",
                                    type: "XML",
                                    controller: thisController
                                })
                                    .then((oDialog) => {
                                        thisController.busyDialog = oDialog;
                                        thisController.busyDialog.open();

                                    })
                                    .catch(error => alert(error.message));
                            } else {
                                thisController.busyDialog.open();
                            }

                            //sap.ui.core.BusyIndicator.show(0)
                            var urlApi = `https://${window.location.hostname}/sap/opu/odata/sap/ZMM_API_PNKHO_COUNT_PRINT`;
                            console.log(urlApi);

                            console.log('Data: ');
                            //console.log(data);
                            var that = thisController
                            aContexts.forEach(element => {
                                let oModel = element.getModel()
                                console.log("Element: ",element)
                                oModel.read(`${element.getPath()}`, {
                                    success: async function (oDataRoot, oResponse) {
                                        var lstItem = '';
                                        var sumTienHang = 0;
                                        var tongSoLuong = 0;
                                        var tongCong = 0;
                                        var arrNo = [];
                                        var arrCo = [];
                                        var arrInvoiceNo = [];
                                        var arrDocumentRefID = [];
                                        var arrGRN = [];
                                        oModel.read(`${element.getPath()}/toaccount_co`, {
                                            success: async function (oDataItem, oResponse) {
                                                //console.log("OdataItemAccoungt:",oDataItem)
                                                oDataItem.results.forEach(data => {
                                                    arrCo.push(data.account96)
                                                })
                                            }
                                        })
                                        oModel.read(`${element.getPath()}/toaccount_no`, {
                                            success: async function (oDataItem, oResponse) {
                                                //console.log("OdataItemAccoungt:",oDataItem)
                                                oDataItem.results.forEach(data => {
                                                    arrNo.push(data.account89)
                                                })
                                            }
                                        })
                                        oModel.read(`${element.getPath()}/to_Item`, {
                                            success: async function (oDataItem, oResponse) {
                                                oDataItem.results.forEach(data => {
                                                    console.log("DAta Item:",oDataItem)
                                                    console.log(JSON.parse(oResponse.body))
                                                    console.log(oResponse)
                                                    console.log(oDataItem)
                                                    if (data.HanLo != '' && data.HanLo !== 0 && data.HanLo && data.HanLo !== '0') {
                                                        var arr = data.HanLo.split("")
                                                        console.log('Hạn sử dụng', arr)
                                                        var nam = `${arr[0]}${arr[1]}${arr[2]}${arr[3]}`
                                                        var thang = `${arr[4]}${arr[5]}`
                                                        var ngay = `${arr[6]}${arr[7]}`
                                                        var xmlItem = `<Data>
                                                                    <stt>${data.MaterialDocumentItem}</stt>
                                                                    <maHang>${data.MaHang}</maHang>
                                                                    <tenHang>${data.TenHang}</tenHang>
                                                                    <dvt>${data.DVT}</dvt>
                                                                    <maLo>${data.MaLo}</maLo>
                                                                    <hanLo>${ngay}/${thang}/${nam}</hanLo>
                                                                    <soLuong>${data.QuantityInEntryUnit}</soLuong>
                                                                    <gia>${VND.format(data.Gia)}</gia>
                                                                    <tien>${VND.format(data.Tien)}</tien>
                                                                </Data>`
                                                    } else {
                                                        var xmlItem = `<Data>
                                                                    <stt>${data.MaterialDocumentItem}</stt>
                                                                    <maHang>${data.MaHang}</maHang>
                                                                    <tenHang>${data.TenHang}</tenHang>
                                                                    <dvt>${data.DVT}</dvt>
                                                                    <maLo>${data.MaLo}</maLo>
                                                                    <hanLo></hanLo>
                                                                    <soLuong>${data.QuantityInEntryUnit}</soLuong>
                                                                    <gia>${VND.format(data.Gia)}</gia>
                                                                    <tien>${VND.format(data.Tien)}</tien>
                                                                </Data>`
                                                    }
                                                    sumTienHang += Number(data.Tien);
                                                    tongSoLuong += Number(data.QuantityInEntryUnit);
                                                    tongCong = sumTienHang + Number(oDataRoot.TaxAmountInCoCodeCrcy);
                                                    //console.log('Item: ',xmlItem);
                                                    lstItem += xmlItem;
                                                    console.log('Tổng cộng: ', tongCong);
                                                    arrNo.push(data.accountNo)
                                                    arrCo.push(data.accountCo)
                                                    arrInvoiceNo.push(data.invoiceDocument)
                                                    arrDocumentRefID.push(data.DocumentReferenceID)
                                                    arrGRN.push(data.GRNNumber)
                                                })
                                                //Chuẩn bị dữ liệu cho xml
                                               var listCo = arrCo.reduce(function (accumulator, currentValue) {
                                                if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                    if (accumulator.indexOf(currentValue) === -1) {
                                                    accumulator.push(currentValue)
                                                    }
                                                }
                                                return accumulator
                                              }, [])
                                            var  listNo = arrNo.reduce(function (accumulator, currentValue) {
                                                if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                    if (accumulator.indexOf(currentValue) === -1) {
                                                    accumulator.push(currentValue)
                                                    }
                                                }
                                                return accumulator
                                              }, [])
                                            var  listInvNo = arrInvoiceNo.reduce(function (accumulator, currentValue) {
                                                if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                    if (accumulator.indexOf(currentValue) === -1) {
                                                    accumulator.push(currentValue)
                                                    }
                                                }
                                                return accumulator
                                              }, [])
                                            var  listDocRefID = arrDocumentRefID.reduce(function (accumulator, currentValue) {
                                                if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                    if (accumulator.indexOf(currentValue) === -1) {
                                                    accumulator.push(currentValue)
                                                    }
                                                }
                                                return accumulator
                                              }, [])
                                            var  listGRN = arrGRN.reduce(function (accumulator, currentValue) {
                                                if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                    if (accumulator.indexOf(currentValue) === -1) {
                                                    accumulator.push(currentValue)
                                                    }
                                                }
                                                return accumulator
                                              }, [])
                                                  var no = listNo.toString()
                                                  var co = listCo.toString()
                                                  var InvNo = listInvNo.toString()
                                                  var DocRefID = listDocRefID.toString()
                                                  var GRN = listGRN.toString()
                                                  console.log('NợARR',arrNo)
                                                  console.log('NợList',listNo)
                                                  console.log('Nợ',no)
                                                  console.log('Có',co)
                                                  console.log('So invoice',InvNo)
                                                  console.log(DocRefID)
                                                  console.log('SỐ GRN',GRN)
                                                //Dữ liệu cung cấp cho api number to word
                                                var rawAmoutWords = JSON.stringify({
                                                    "amount": `${tongCong}`,
                                                    "waers": `${oDataRoot.CompanyCodeCurrency}`,
                                                    "lang": "VI"
                                                });
                                                var url_amountWords = "https://" + window.location.hostname + "/sap/bc/http/sap/zcore_api_amount_in_words?=";
                                                console.log(url_amountWords)
                                                $.ajax({
                                                    url: url_amountWords,
                                                    type: "POST",
                                                    contentType: "application/json",
                                                    data: rawAmoutWords,
                                                    success: function (resp, textStatus, jqXHR) {
                                                        var dataWord = JSON.parse(resp);
                                                        var xml = `<?xml version="1.0" encoding="UTF-8"?>
                                                        <form1>
                                                           <subPage>
                                                              <Header>
                                                                 <Subform1>
                                                                    <Name-Address>
                                                                       <name>${oDataRoot.CompanyCodeName}</name>
                                                                       <address>${oDataRoot.StreetNameCompany}, ${oDataRoot.CityNameCompany}</address>
                                                                    </Name-Address>
                                                                    <MauSo>Mẫu số 01-TC-QT-04</MauSo>
                                                                 </Subform1>
                                                                 <Heading>
                                                                    <Information>
                                                                     <Diadiem12>Địa điểm: ${oDataRoot.StreetNamePlant}, ${oDataRoot.CityNamePlant}</Diadiem12>
                                                                       <ngay10></ngay10>
                                                                       <txtTheoHoaDon>Theo hóa đơn số: ${DocRefID}                     Ngày ${oDataRoot.PostingDate.getDate()} tháng ${oDataRoot.PostingDate.getMonth() + 1} năm ${oDataRoot.PostingDate.getFullYear()}</txtTheoHoaDon>
                                                                       <txtNhapTaiKho>Nhập tại kho: ${oDataRoot.PlantName}</txtNhapTaiKho>
                                                                       <txtNguoiGiaoHang>Họ và tên người giao hàng: ${oDataRoot.nameNguoiGiaHang}</txtNguoiGiaoHang>
                                                                    </Information>
                                                                    <Information_2>
                                                                       <txtSo>Số: ${oDataRoot.MaterialDocument}</txtSo>
                                                                       <txtNo>Nợ: ${no}</txtNo>
                                                                       <txtCo>Có: ${co}</txtCo>
                                                                    </Information_2>
                                                                 </Heading>
                                                                 <title>PHIẾU NHẬP KHO</title>
                                                                 <Date>Ngày ${oDataRoot.PostingDate.getDate()} tháng ${oDataRoot.PostingDate.getMonth() + 1} năm ${oDataRoot.PostingDate.getFullYear()}</Date>
                                                              </Header>
                                                              <Main>
                                                                 <Table>
                                                                    <Header>
                                                                       <headerSTT>STT</headerSTT>
                                                                       <headerMaHang>Mã hàng</headerMaHang>
                                                                       <headerTenHang>Tên hàng</headerTenHang>
                                                                       <headerDVT>DVT</headerDVT>
                                                                       <headerMaLo>Mã lô</headerMaLo>
                                                                       <headerHanLo>Hạn Lô</headerHanLo>
                                                                       <headerSoLuong>Số lượng</headerSoLuong>
                                                                       <headerGia>Giá</headerGia>
                                                                       <headerTien>Tiền</headerTien>
                                                                    </Header>
                                                                    <subHeader/>
                                                                    ${lstItem}
                                                                    <Footer-TienHang>
                                                                       <lblTongSoLuong>Tổng số lượng: ${tongSoLuong}</lblTongSoLuong>
                                                                       <lblTienHang>Tiền hàng</lblTienHang>
                                                                       <sumTienHang>${VND.format(sumTienHang)}</sumTienHang>
                                                                    </Footer-TienHang>
                                                                    <Footer-TienThue>
                                                                       <lblTienThue>Tiền thuế</lblTienThue>
                                                                       <sumTienThue>${VND.format(oDataRoot.TaxAmountInCoCodeCrcy)}</sumTienThue>
                                                                    </Footer-TienThue>
                                                                    <Footer-TongCong>
                                                                       <lblTongCong>Tổng cộng</lblTongCong>
                                                                       <tongCong>${VND.format(tongCong)}</tongCong>
                                                                    </Footer-TongCong>
                                                                 </Table>
                                                                 <Footer>
                                                                    <soTienBangChu>Số tiền (Viết bằng chữ): ${dataWord.Result}</soTienBangChu>
                                                                    <soChungTuGoc>Số chứng từ gốc kèm theo: ${InvNo} - ${GRN}</soChungTuGoc>
                                                                    <Subform2>
                                                                       <sign02>Kế Toán Trưởng</sign02>
                                                                    <sign04>Ngày ${dateNow.getDate()} tháng ${dateNow.getMonth() + 1} năm ${dateNow.getFullYear()}</sign04>
                                                                    <sign01>Người lập</sign01>
                                                                    <sign03>${oDataRoot.PNK_KTT}</sign03>
                                                                    <Sign03></Sign03>
                                                                    </Subform2>
                                                                 </Footer>
                                                              </Main>
                                                           </subPage>
                                                        </form1>`
                                                        console.log('Table: ', xml);
                                                        var dataEncode = window.btoa(unescape(encodeURIComponent(xml)))
                                                        var raw = JSON.stringify({
                                                            "id": `${oDataRoot.MaterialDocumentYear}${oDataRoot.Plant}${oDataRoot.MaterialDocument}`,
                                                            "report": "pnkho",
                                                            "xdpTemplate": "PHIEUNHAPKHO/PHIEUNHAPKHO",
                                                            "zxmlData": dataEncode,
                                                            "formType": "interactive",
                                                            "formLocale": "en_US",
                                                            "taggedPdf": 1,
                                                            "embedFont": 0,
                                                            "changeNotAllowed": false,
                                                            "printNotAllowed": false
                                                        });
                                                        var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                                                        $.ajax({
                                                            url: url_render,
                                                            type: "POST",
                                                            contentType: "application/json",
                                                            data: raw,
                                                            success: function (response, textStatus, jqXHR) {

                                                                let data = JSON.parse(response)
                                                                //once the API call is successfull, Display PDF on screen
                                                                console.log("Data:", data)
                                                                console.log("FileContent: ", data.fileContent)
                                                                var decodedPdfContent = atob(data.fileContent)//base65 to string ?? to pdf

                                                                var byteArray = new Uint8Array(decodedPdfContent.length);
                                                                for (var i = 0; i < decodedPdfContent.length; i++) {
                                                                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                                                                }
                                                                var blob = new Blob([byteArray.buffer], {
                                                                    type: 'application/pdf'
                                                                });
                                                                var _pdfurl = URL.createObjectURL(blob);
                                                                console.log('Link download:', _pdfurl)
                                                                //in mà k cho xem trước
                                                                let link = document.createElement('a')
                                                                link.href = _pdfurl
                                                                link.download = `${oDataRoot.MaterialDocumentYear}${oDataRoot.Plant}${oDataRoot.MaterialDocument}.pdf`
                                                                link.dispatchEvent(new MouseEvent('click'))
                                                                if (!thisController._PDFViewer) {
                                                                    thisController._PDFViewer = new sap.m.PDFViewer({
                                                                        width: "auto",
                                                                        source: _pdfurl,
                                                                    });
                                                                    jQuery.sap.addUrlWhitelist("blob");
                                                                }
                                                                that.busyDialog.close();

                                                            },
                                                            error: function (data) {
                                                                that.busyDialog.close();
                                                                console.log('message Error' + JSON.stringify(data));
                                                            }
                                                        });
                                                    },
                                                    error: function (data) {
                                                        that.busyDialog.close();
                                                        console.log('message Error' + JSON.stringify(data));
                                                    }
                                                });
                                            }
                                        })
                                    }
                                })
                            })
                        }
                        else if (sAction == "Xem trước") {
                            let aContexts = thisController.extensionAPI.getSelectedContexts();
                            console.log(aContexts.length);
                            const dateNow = new Date();
                            const VND = new Intl.NumberFormat('en-DE');
                            if (!thisController.busyDialog) {
                                Fragment.load({
                                    id: "idBusyDialog",
                                    name: "zpnkho.controller.fragment.Busy",
                                    type: "XML",
                                    controller: thisController
                                })
                                    .then((oDialog) => {
                                        thisController.busyDialog = oDialog;
                                        thisController.busyDialog.open();

                                    })
                                    .catch(error => alert(error.message));
                            } else {
                                thisController.busyDialog.open();
                            }

                            //sap.ui.core.BusyIndicator.show(0)
                            var urlApi = `https://${window.location.hostname}/sap/opu/odata/sap/ZMM_API_PNKHO_COUNT_PRINT`;
                            console.log(urlApi);
                            //console.log(data);
                            var that = thisController
                            aContexts.forEach(element => {
                                let oModel = element.getModel()
                                console.log("Element: ",element)
                                oModel.read(`${element.getPath()}`, {
                                    success: async function (oDataRoot, oResponse) {
                                        var lstItem = '';
                                        var sumTienHang = 0;
                                        var tongSoLuong = 0;
                                        var tongCong = 0;
                                        var arrNo = [];
                                        var arrCo = [];
                                        var arrInvoiceNo = [];
                                        var arrDocumentRefID = [];
                                        var arrGRN = [];
                                        oModel.read(`${element.getPath()}/toaccount_co`, {
                                            success: async function (oDataItem, oResponse) {
                                                //console.log("OdataItemAccoungt:",oDataItem)
                                                oDataItem.results.forEach(data => {
                                                    arrCo.push(data.account96)
                                                })
                                            }
                                        })
                                        oModel.read(`${element.getPath()}/toaccount_no`, {
                                            success: async function (oDataItem, oResponse) {
                                                //console.log("OdataItemAccoungt:",oDataItem)
                                                oDataItem.results.forEach(data => {
                                                    arrNo.push(data.account89)
                                                })
                                            }
                                        })
                                        oModel.read(`${element.getPath()}/to_Item`, {
                                            success: async function (oDataItem, oResponse) {
                                                oDataItem.results.forEach(data => {
                                                    console.log("DAta Item:",oDataItem)
                                                    console.log(JSON.parse(oResponse.body))
                                                    console.log(oResponse)
                                                    console.log(oDataItem)
                                                    if (data.HanLo != '' && data.HanLo !== 0 && data.HanLo && data.HanLo !== '0') {
                                                        var arr = data.HanLo.split("")
                                                        console.log('Hạn sử dụng', arr)
                                                        var nam = `${arr[0]}${arr[1]}${arr[2]}${arr[3]}`
                                                        var thang = `${arr[4]}${arr[5]}`
                                                        var ngay = `${arr[6]}${arr[7]}`
                                                        var xmlItem = `<Data>
                                                                    <stt>${data.MaterialDocumentItem}</stt>
                                                                    <maHang>${data.MaHang}</maHang>
                                                                    <tenHang>${data.TenHang}</tenHang>
                                                                    <dvt>${data.DVT}</dvt>
                                                                    <maLo>${data.MaLo}</maLo>
                                                                    <hanLo>${ngay}/${thang}/${nam}</hanLo>
                                                                    <soLuong>${data.QuantityInEntryUnit}</soLuong>
                                                                    <gia>${VND.format(data.Gia)}</gia>
                                                                    <tien>${VND.format(data.Tien)}</tien>
                                                                </Data>`
                                                    } else {
                                                        var xmlItem = `<Data>
                                                                    <stt>${data.MaterialDocumentItem}</stt>
                                                                    <maHang>${data.MaHang}</maHang>
                                                                    <tenHang>${data.TenHang}</tenHang>
                                                                    <dvt>${data.DVT}</dvt>
                                                                    <maLo>${data.MaLo}</maLo>
                                                                    <hanLo></hanLo>
                                                                    <soLuong>${data.QuantityInEntryUnit}</soLuong>
                                                                    <gia>${VND.format(data.Gia)}</gia>
                                                                    <tien>${VND.format(data.Tien)}</tien>
                                                                </Data>`
                                                    }
                                                    sumTienHang += Number(data.Tien);
                                                    tongSoLuong += Number(data.QuantityInEntryUnit);
                                                    tongCong = sumTienHang + Number(oDataRoot.TaxAmountInCoCodeCrcy);
                                                    //console.log('Item: ',xmlItem);
                                                    lstItem += xmlItem;
                                                    console.log("Tiền thuế:", Number(oDataRoot.TaxAmountInCoCodeCrcy))
                                                    console.log('Tổng cộng: ', tongCong);
                                                    arrNo.push(data.accountNo)
                                                    arrCo.push(data.accountCo)
                                                    arrInvoiceNo.push(data.invoiceDocument)
                                                    arrDocumentRefID.push(data.DocumentReferenceID)
                                                    arrGRN.push(data.GRNNumber)
                                                })
                                                //Chuẩn bị dữ liệu cho xml
                                                var listCo = arrCo.reduce(function (accumulator, currentValue) {
                                                    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                        if (accumulator.indexOf(currentValue) === -1) {
                                                        accumulator.push(currentValue)
                                                        }
                                                    }
                                                    return accumulator
                                                  }, [])
                                                var  listNo = arrNo.reduce(function (accumulator, currentValue) {
                                                    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                        if (accumulator.indexOf(currentValue) === -1) {
                                                        accumulator.push(currentValue)
                                                        }
                                                    }
                                                    return accumulator
                                                  }, [])
                                                var  listInvNo = arrInvoiceNo.reduce(function (accumulator, currentValue) {
                                                    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                        if (accumulator.indexOf(currentValue) === -1) {
                                                        accumulator.push(currentValue)
                                                        }
                                                    }
                                                    return accumulator
                                                  }, [])
                                                var  listDocRefID = arrDocumentRefID.reduce(function (accumulator, currentValue) {
                                                    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                        if (accumulator.indexOf(currentValue) === -1) {
                                                        accumulator.push(currentValue)
                                                        }
                                                    }
                                                    return accumulator
                                                  }, [])
                                                var  listGRN = arrGRN.reduce(function (accumulator, currentValue) {
                                                    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                                                        if (accumulator.indexOf(currentValue) === -1) {
                                                        accumulator.push(currentValue)
                                                        }
                                                    }
                                                    return accumulator
                                                  }, [])
                                                  var no = listNo.toString()
                                                  var co = listCo.toString()
                                                  var InvNo = listInvNo.toString()
                                                  var DocRefID = listDocRefID.toString()
                                                  var GRN = listGRN.toString()
                                                  console.log("ArrGRN:",arrGRN)
                                                  console.log("LISTGRN:",arrGRN)
                                                  console.log("GRN:",GRN)
                                                  console.log('NợARR',arrNo)
                                                  console.log('NợList',listNo)
                                                  console.log('Nợ',no)
                                                  console.log('Có',co)
                                                  console.log('So invoice',InvNo)
                                                  console.log(DocRefID)
                                                  console.log('SỐ GRN',GRN)
                                                //Dữ liệu cung cấp cho api number to word
                                                var rawAmoutWords = JSON.stringify({
                                                    "amount": `${tongCong}`,
                                                    "waers": `${oDataRoot.CompanyCodeCurrency}`,
                                                    "lang": "VI"
                                                });
                                                var url_amountWords = "https://" + window.location.hostname + "/sap/bc/http/sap/zcore_api_amount_in_words?=";
                                                console.log('data đọc chữ:',rawAmoutWords)
                                                $.ajax({
                                                    url: url_amountWords,
                                                    type: "POST",
                                                    contentType: "application/json",
                                                    data: rawAmoutWords,
                                                    success: function (resp, textStatus, jqXHR) {
                                                        var dataWord = JSON.parse(resp);
                                                        var xml = `<?xml version="1.0" encoding="UTF-8"?>
                                                        <form1>
                                                           <subPage>
                                                              <Header>
                                                                 <Subform1>
                                                                    <Name-Address>
                                                                       <name>${oDataRoot.CompanyCodeName}</name>
                                                                       <address>${oDataRoot.StreetNameCompany}, ${oDataRoot.CityNameCompany}</address>
                                                                    </Name-Address>
                                                                    <MauSo>Mẫu số 01-TC-QT-04</MauSo>
                                                                 </Subform1>
                                                                 <Heading>
                                                                    <Information>
                                                                     <Diadiem12>Địa điểm: ${oDataRoot.StreetNamePlant}, ${oDataRoot.CityNamePlant}</Diadiem12>
                                                                       <ngay10></ngay10>
                                                                       <txtTheoHoaDon>Theo hóa đơn số: ${DocRefID}                     Ngày ${oDataRoot.PostingDate.getDate()} tháng ${oDataRoot.PostingDate.getMonth() + 1} năm ${oDataRoot.PostingDate.getFullYear()}</txtTheoHoaDon>
                                                                       <txtNhapTaiKho>Nhập tại kho: ${oDataRoot.PlantName}</txtNhapTaiKho>
                                                                       <txtNguoiGiaoHang>Họ và tên người giao hàng: ${oDataRoot.nameNguoiGiaHang}</txtNguoiGiaoHang>
                                                                    </Information>
                                                                    <Information_2>
                                                                       <txtSo>Số: ${oDataRoot.MaterialDocument}</txtSo>
                                                                       <txtNo>Nợ: ${no}</txtNo>
                                                                       <txtCo>Có: ${co}</txtCo>
                                                                    </Information_2>
                                                                 </Heading>
                                                                 <title>PHIẾU NHẬP KHO</title>
                                                                 <Date>Ngày ${oDataRoot.PostingDate.getDate()} tháng ${oDataRoot.PostingDate.getMonth() + 1} năm ${oDataRoot.PostingDate.getFullYear()}</Date>
                                                              </Header>
                                                              <Main>
                                                                 <Table>
                                                                    <Header>
                                                                       <headerSTT>STT</headerSTT>
                                                                       <headerMaHang>Mã hàng</headerMaHang>
                                                                       <headerTenHang>Tên hàng</headerTenHang>
                                                                       <headerDVT>DVT</headerDVT>
                                                                       <headerMaLo>Mã lô</headerMaLo>
                                                                       <headerHanLo>Hạn Lô</headerHanLo>
                                                                       <headerSoLuong>Số lượng</headerSoLuong>
                                                                       <headerGia>Giá</headerGia>
                                                                       <headerTien>Tiền</headerTien>
                                                                    </Header>
                                                                    <subHeader/>
                                                                    ${lstItem}
                                                                    <Footer-TienHang>
                                                                       <lblTongSoLuong>Tổng số lượng: ${tongSoLuong}</lblTongSoLuong>
                                                                       <lblTienHang>Tiền hàng</lblTienHang>
                                                                       <sumTienHang>${VND.format(sumTienHang)}</sumTienHang>
                                                                    </Footer-TienHang>
                                                                    <Footer-TienThue>
                                                                       <lblTienThue>Tiền thuế</lblTienThue>
                                                                       <sumTienThue>${VND.format(oDataRoot.TaxAmountInCoCodeCrcy)}</sumTienThue>
                                                                    </Footer-TienThue>
                                                                    <Footer-TongCong>
                                                                       <lblTongCong>Tổng cộng</lblTongCong>
                                                                       <tongCong>${VND.format(tongCong)}</tongCong>
                                                                    </Footer-TongCong>
                                                                 </Table>
                                                                 <Footer>
                                                                    <soTienBangChu>Số tiền (Viết bằng chữ): ${dataWord.Result}</soTienBangChu>
                                                                    <soChungTuGoc>Số chứng từ gốc kèm theo: ${InvNo} - ${GRN}</soChungTuGoc>
                                                                    <Subform2>
                                                                       <sign02>Kế Toán Trưởng</sign02>
                                                                    <sign04>Ngày ${dateNow.getDate()} tháng ${dateNow.getMonth() + 1} năm ${dateNow.getFullYear()}</sign04>
                                                                    <sign01>Người lập</sign01>
                                                                    <sign03>HOÀNG ĐĂNG ÁNH</sign03>
                                                                    <Sign03></Sign03>
                                                                    </Subform2>
                                                                 </Footer>
                                                              </Main>
                                                           </subPage>
                                                        </form1>`
                                                        console.log('Table: ', xml);
                                                        var dataEncode = window.btoa(unescape(encodeURIComponent(xml)))
                                                        var raw = JSON.stringify({
                                                            "id": `${oDataRoot.MaterialDocumentYear}${oDataRoot.Plant}${oDataRoot.MaterialDocument}`,
                                                            "report": "pnkho",
                                                            "xdpTemplate": "PHIEUNHAPKHO/PHIEUNHAPKHO",
                                                            "zxmlData": dataEncode,
                                                            "formType": "interactive",
                                                            "formLocale": "en_US",
                                                            "taggedPdf": 1,
                                                            "embedFont": 0,
                                                            "changeNotAllowed": false,
                                                            "printNotAllowed": false
                                                        });
                                                        var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                                                        $.ajax({
                                                            url: url_render,
                                                            type: "POST",
                                                            contentType: "application/json",
                                                            data: raw,
                                                            success: function (response, textStatus, jqXHR) {

                                                                let data = JSON.parse(response)
                                                                //once the API call is successfull, Display PDF on screen
                                                                console.log("Data:", data)
                                                                console.log("FileContent: ", data.fileContent)
                                                                var decodedPdfContent = atob(data.fileContent)//base65 to string ?? to pdf

                                                                var byteArray = new Uint8Array(decodedPdfContent.length);
                                                                for (var i = 0; i < decodedPdfContent.length; i++) {
                                                                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                                                                }
                                                                var blob = new Blob([byteArray.buffer], {
                                                                    type: 'application/pdf'
                                                                });
                                                                var _pdfurl = URL.createObjectURL(blob);

                                                                if (!thisController._PDFViewer) {
                                                                    thisController._PDFViewer = new sap.m.PDFViewer({
                                                                        width: "auto",
                                                                        source: _pdfurl,
                                                                        // close: function (params) {
                                                                        //     console.log('close pdf')
                                                                        // }
                                                                    });
                                                                    jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
                                                                }
                                                                if (thisController._PDFViewer) {
                                                                    thisController._PDFViewer = new sap.m.PDFViewer({
                                                                        width: "auto",
                                                                        source: _pdfurl,
                                                                        // close: function (params) {
                                                                        //     console.log('close pdf')
                                                                        // }
                                                                    });
                                                                    jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
                                                                }
                                                                thisController._PDFViewer.downloadPDF();
                                                                that.busyDialog.close();

                                                            },
                                                            error: function (data) {
                                                                that.busyDialog.close();
                                                                console.log('message Error' + JSON.stringify(data));
                                                            }
                                                        });
                                                    },
                                                    error: function (data) {
                                                        that.busyDialog.close();
                                                        console.log('message Error' + JSON.stringify(data));
                                                    }
                                                });
                                            }
                                        })
                                        console.log("DAta Root:",oDataRoot)
                                    }
                                })
                                
                            })
                        }
                        else { }
                    }
                })
            }
        }
    }
)