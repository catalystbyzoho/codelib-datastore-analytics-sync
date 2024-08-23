#### Data Store Analytics Sync CodeLib Solution

The Data Store Analytics Sync CodeLib solution enables you to export data in bulk from the Catalyst Cloud Scale Data Store table to a table in Zoho Analytics, and also maintain a sync between the two data sources.

**Note:** You can get more detailed information on the steps to install and configure the Data Store Analytics Sync CodeLib solution from your Catalyst console. You must navigate to the bottom of your Catalyst console, where you will find the _Catalyst CodeLib_ section. You can click the **Data Store Analytics Sync CodeLib** tile to access the steps.

#### How does the CodeLib solution work?

Upon installing this CodeLib solution, predefined Catalyst components specific to the solution will be configured in your project automatically. These include two [Catalyst Serverless functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/introduction/) (one [Event](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/) and one [Advanced I/O](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/)) in **Node.js** and a cache segment in the [Catalyst Cloud Scale Cache](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/) component. We will need to configure an event rule in the [Catalyst Component Event Listener](https://docs.catalyst.zoho.com/en/cloud-scale/help/event-listeners/component-event-listeners/) component manually.

First, you will need a Zoho Analytics account to implement this CodeLib solution. We have implemented the [Zoho Analytics SDK](https://css.zohostatic.com/analytics/restapi/v2/m2/docs/nodejs/) package in the functions code of our CodeLib solution. To authenticate and access the resources of your Zoho Analytics account securely, you will need to register a self-client application from Zoho's [API console for OAuth configuration](https://api-console.zoho.com/). Make sure you note down the generated Client ID and Client secret credentials for accessing your Zoho Analytics account. You can then refer to [this](https://docs.catalyst.zoho.com/en/api/oauth2/generate-access-and-refresh-token/#GenerateAccessandRefreshToken) page for the steps to generate access and refresh tokens. You will need to configure these credentials as [environmental variables](https://docs.catalyst.zoho.com/en/serverless/help/functions/implementation/#environmental-variables) in the Catalyst Functions component after the CodeLib solution is installed.

You will also need to configure a key named **CODELIB_SECRET_KEY** in the functions, and pass this in the request header every time you try to access any endpoints of the pre-configured functions in the CodeLib solution**.**This key allows you to access the Catalyst resources of the CodeLib solution securely.

Upon the installation of the CodeLib solution, when you invoke the **/import** endpoint of the **zoho_analytics_datastore_sync_routes_handler(**[Advanced I/O](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/)**)**function as a _cURL_ request, a key is auto-created in the cache segment (**ZohoAnalyticsDatastoreSync**). The [Catalyst Data Store Bulk Read API](https://docs.catalyst.zoho.com/en/api/code-reference/cloud-scale/data-store/bulk-read-rows/create-bulk-read-job/#CreateBulkReadJob) is invoked to read data in bulk from the Data Store table and a maximum of 200,000 data rows can be read at a single point of time. For this purpose, you will need to pass the Catalyst Data Store table name, along with other necessary details, in the request payload of the cURL request. These details include the organization ID, workspace ID and view ID in Zoho Analytics.

After the first 200,000 records are read, the response is sent to the callback URL **/export-datastore**. This endpoint handles the logic to update the corresponding [download URL](https://docs.catalyst.zoho.com/en/api/code-reference/cloud-scale/data-store/bulk-read-rows/download-bulk-read-result/#DownloadBulkReadResult) response the auto-created cache segment (**ZohoAnalyticsData storeSync**). This process repeats itself until all the records from the respective table in the Data Store is read. After the first download URL is updated in the cache segment, the [Zoho Analytics Bulk Import API](https://www.zoho.com/analytics/api/v2/bulk-api/import-data/existing-table.html) is invoked. This API handles the logic to fetch data from the download URL and import them to the view in Zoho Analytics. Now, the response is sent to the configured callback URL **/import-analytics.**

The **/import-analytics** endpoint handles the logic to invoke the Bulk Import API until all the records are imported to the view in Zoho Analytics. After all of them are imported, the key in the cache segment is automatically deleted and the response of the bulk import job is returned by the **zoho_analytics_datastore_sync_routes_handler** function. You can also check the status of the bulk import operation in the [Catalyst Application Logs](https://docs.catalyst.zoho.com/en/devops/help/logs/application-logs/) component.

You will need to configure the OAuth credentials as environmental variables in this Advanced I/O function(**zoho_analytics_datastore_sync_routes_handler**) and also the event function(**zoho_analytics_datastore_sync_record_handler**) to securely access the resources in your Zoho Analytics account. For more details on the configurations to be made, please refer to the _How to use_ section in the console.

You can also update the data in a single row in Analytics by invoking the **/row** endpoint of the **zoho_analytics_datastore_sync_routes_handler** function. The rowID, tablename, orgid, workspaceid, viewid, and the action (either insertion or updation of rows) must be passed as parameters in the request payload to the **/row** endpoint. This endpoint handles the logic to fetch the data from the particular row in the Catalyst Cloud Scale Data Store and update it in the corresponding view in Zoho Analytics. The status of the operation will be returned by the **zoho_analytics_datastore_sync_routes_handler** function.

However, you can't delete a particular row in Analytics directly by invoking this endpoint. In that case, you will need to perform the delete operation manually.

You can configure a Catalyst Application Alert in order to track the bulk import job. You can simply add the email recipients to whom you need to intimate the status of the bulk import job as a Notifier under the **Notify Emails** section while configuring the application alert. In the cases when a particular row has failed in the bulk import operation, you can update that specific row by invoking the **/row** endpoint of the **zoho_analytics_datastore_sync_routes_handler** function. For more details on the configurations to be made in the application alert, please refer to the _How to use_ section in the console.

To maintain a sync between the Data Store table and the Analytics view, you can configure an event rule in the Catalyst Component Event Listeners component and associate it with the Event function (**zoho_analytics_datastore_sync_record_handler**). Please refer to the _How to use_ section in the console to know the configurations to be made in the event rule. The event listener will be configured to listen to any operations being made to the Data Store table. Whenever it encounters an insertion or updation event, it invokes the corresponding Catalyst Event function (**zoho_analytics_datastore_sync_record_handler**).

This function handles the logic to monitor the Catalyst Cloud Scale Data Store table and ensures any updates made to it is reflected in the corresponding view in Zoho Analytics. Also note that you will need to configure the list of Data Store tables that need to be in sync, in this rule under the Event Listeners component in the Catalyst console.

**Note:**

- The Catalyst resources pre-configured as a part of the CodeLib solution are not subject to HIPPA complaince. If you are working with ePHI and other sensitive user data, we strongly recommend you to make use of [Catalyst's HIPAA compliance](https://docs.catalyst.zoho.com/en/getting-started/hipaa-compliance/) support. You can enable the PII/ePHI validator for for the necessary columns in the Data Store tables.

- You can get more detailed information on the steps to install and configure the Data Store Analytics Sync CodeLib solution from the **_Catalyst CodeLib_** section in your Catalyst console.

####

#### Resources Involved

The following Catalyst resources are used as a part of the Data Store Analytics Sync CodeLib solution:

**[Catalyst Serverless Functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/introduction/):**

This **zoho_analytics_datastore_sync_routes_handler([Advanced I/O](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/))**function handles the logic to export all the records of a Catalyst Data Store table in bulk to a view in Zoho Analytics. It also allows you to update a single row in the Zoho Analytics view.

The **zoho_analytics_datastore_sync_record_handler([Event](https://docs.catalyst.zoho.com/en/serverless/help/functions/event-functions/)**) function is invoked when any insert or update event occurs in the Data Store table. The event listener associated with this function monitors the Data Store table and invokes the event function on occurence of any events.

**[Catalyst Cloud Scale Event Listener](https://docs.catalyst.zoho.com/en/cloud-scale/help/event-listeners/introduction/):**

We will be configuring an event rule in the [Catalyst Component Event Listener](https://docs.catalyst.zoho.com/en/cloud-scale/help/event-listeners/component-event-listeners/) of your project:

- **ZohoAnalyticsDatastoreSyncRecord:**This event rule is configured to invoke the **zoho_analytics_datastore_sync_record_handler** Event function**.**

**[Catalyst Cloud Scale Cache](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/) :**

The cache segment (**ZohoAnalyticsDatastoreSync**) is used to store the download URLs of the bulk read API response temporarily.

**[Catalyst DevOps Application Alerts :](https://docs.catalyst.zoho.com/en/devops/help/application-alerts/introduction/)**

You can create and configure an application alert (**Failed_to_update_analytics**) to send emails to the required email recipients with the details of the failed Data Store rows during the bulk import operation. Also note that creating and configuring an application alert is completely optional.