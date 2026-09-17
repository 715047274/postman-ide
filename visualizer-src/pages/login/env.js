// Change this one value to point every environment below at a different
// build — same pattern as your original script. Since this is a plain
// .js module (not .json), template literals work: every URL/name that
// embeds `${version}` updates automatically wherever this file is used.
const version = 'qa875'

export const environments = {
  qa10005: {
    baseUrl: `https://az.qa.dayforcehcm.com/${version}/MyDayforce`,
    uiUrl: `https://az.qa.dayforcehcm.com/${version}/MyDayforce`,
    testSvcUrl: `https://az.qa.dayforcehcm.com/${version}/TestServices/TestService.svc`,
    clientName: `az${version}_10005`,
    adminName: 'cadmin',
    password: '1',
    remoteFrontendUrl: 'https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master/payrollfrontendbridgeservice',
    gatewayContext: {
      controlDbKey: `nan4dfc1sql944.custadds.com|${version}_control`,
      infoServiceUrl: 'https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master/PayrollInfoService',
      payrollServiceBaseUrl: 'https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master',
      payrollVersionedServiceBaseUrl: 'https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master',
      clientId: 10005,
      walletGatewayUrl: 'https://pg-gateway-auto.np.dayforcehcm.com',
      dfidUrlKey: 'https://dfidqa-internal.np.dayforcehcm.com',
      dfidAdminUrlKey: 'https://dfidadminqa-internal.np.dayforcehcm.com'
    }
  },
  qa1086:{
    baseUrl: `https://az.qa.dayforcehcm.com/${version}/MyDayforce`,
    uiUrl: `https://az.qa.dayforcehcm.com/${version}/MyDayforce`,
    testSvcUrl: `https://az.qa.dayforcehcm.com/${version}/TestServices/TestService.svc`,
    clientName: `${version}payroll1086`,
    adminName: "cadmin",
    password: "1",
    remoteFrontendUrl:"https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master/payrollfrontendbridgeservice",
    gatewayContext:{
      controlDbKey: `nan4dfc1sql944.custadds.com|${version}_control`,
      infoServiceUrl: "https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master/PayrollInfoService",
      payrollServiceBaseUrl: "https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master",
      payrollVersionedServiceBaseUrl: "https://qa1-dfpayroll-eastus.np.dayforcehcm.com/qa/master",
      clientId: 11086,
      walletGatewayUrl: "https://pg-gateway-auto.np.dayforcehcm.com",
      dfidUrlKey:"https://dfidqa-internal.np.dayforcehcm.com",
      dfidAdminUrlKey:"https://dfidadminqa-internal.np.dayforcehcm.com"
    }
  },
  hspr:{
    baseUrl:"https://qapraz.qa.dayforcehcm.com/hspr/MyDayforce",
    uiUrl:"https://qapraz.qa.dayforcehcm.com/hspr/MyDayforce",
    testSvcUrl:"https://qapraz.qa.dayforcehcm.com/hspr/TestServices/TestService.svc",
    clientName: "qaprazhspr_1886509",
    adminName: "cadmin",
    password: "p@yrol1",
    remoteFrontendUrl:"https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master/payrollfrontendbridgeservice",
    gatewayContext:{
      controlDbKey: "nan4dfc1sql944.custadds.com|devhspr_control",
      infoServiceUrl: "https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master/PayrollInfoService",
      payrollServiceBaseUrl: "https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master",
      payrollVersionedServiceBaseUrl: "https://dev-dfpayroll-eastus2.np.dayforcehcm.com/dev/master",
      clientId: 1886509,
      walletGatewayUrl: "https://pg-gateway-auto.np.dayforcehcm.com",
      dfidUrlKey:"https://dfidqa-internal.np.dayforcehcm.com",
      dfidAdminUrlKey:"https://dfidadminqa-internal.np.dayforcehcm.com"
    }
  },
  autotest12:{
    baseUrl:"https://azatpr0.dayforce.com/stui/MyDayforce",
    uiUrl:"https://azatpr0.dayforce.com/stui/MyDayforce",
    testSvcUrl:"https://azatpr0.dayforce.com/stui/TestServices/TestService.svc",
    clientName: "azatpr0stui_10012",
    adminName: "cadmin",
    password: "1",
    remoteFrontendUrl:"https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master/payrollfrontendbridgeservice",
    gatewayContext:{
      controlDbKey: "azh5dfnats002.custadds.com|azatpr0stui_control",
      infoServiceUrl: "https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master/payrollinfoservice",
      payrollServiceBaseUrl: "https://auto1-dfpayroll-eastus.np.dayforcehcm.com/auto/master",
      payrollVersionedServiceBaseUrl: "https://dev-dfpayroll-eastus2.np.dayforcehcm.com/dev/master",
      clientId: 10012,
      currentRoleId: 1003,
      clientNamespace:'azatpr0stui_10012',
      walletGatewayUrl: "https://pg-gateway-auto.np.dayforcehcm.com",
      dfidUrlKey:"https://dfidqa-internal.np.dayforcehcm.com",
      dfidAdminUrlKey:"https://dfidadminqa-internal.np.dayforcehcm.com",
      sessionTicket:''
    }
  }
}