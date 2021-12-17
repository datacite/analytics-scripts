window.addEventListener('load', function() {

  ///////////////////////////////////////
  // Set data-analytics on appropriate elements for call to plausible on a download event.
  //
  // Properties can be provided as follows:
  //    const DOI = "10.5061/dryad.0cfxpnw32"; (javascript, in document header - set before other scripts)
  //    json+ld (schema.org metadata)
  //    html meta tags (dublin core metadata)
  //    page url (could contain the doi)
  //
  // A lot of the code here is the suggested code for custom events documented at:
  // https://plausible.io/docs/custom-event-goals
  ///////////////////////////////////////

  //
  // On load:
  //   Scan the document for metadata.  Extract the DOI.
  //   Scan the document for elements marked with the data-analytics attribute (download links or buttons).
  //   Construct the data-analytics tag with the appropriate properties for any links or buttons, setting the doi property.
  //   Other properties can be added if needed.
  //

  // The event must match exactly with what is defined in plausible analytics as a custom goal.
  const DOWNLOAD_EVENT = "downloads";
  const DOWNLOAD_ATTRIBUTE = "data-analytics-downloads";
  const DOWNLOAD_PROPS = {"props":{}};

  ///////////////
  // FOR TESTING.
  // const DOI = "https://doi.org/10.5061/dryad.0cfxpnw32";
  // const TEST_URL = 'https://datadryad.org/stash/dataset/doi:10.5061%2Fdryad.0cfxpnw32';
  //////////////

  registerDownloads();

  //
  // This is the main process for registering downloads for analytics
  //
  function registerDownloads () {
    var element;
    var elements;
    var doi = "";

    //
    // GET the DOI from any of the following sources.  D
    //

    doi = (
      doi_in_tracking_snippet() ||
      doi_in_schema_org_md() ||
      doi_in_dublin_core_md() ||
      doi_in_url() ||
      ""
    );

    ////////////////////////////////////

    // Set the data-analytics properties for elements marked as data-analytics-downloads.
    // The only property we handle right now is doi.
    // Others can always be added.
    // An error is reported if there is no doi, but we still handle it
    // because it tells us that there are some downloads missing a doi.

    if (!doi) {
      console.error("Error: No DOI provided in metadata.");
    }

    // Add data-analytics attribute to elements marked with data-analytics-downloads.
    elements = document.querySelectorAll("a[" + DOWNLOAD_ATTRIBUTE + "]");
    registerDownloadProperties(elements, doi);

    // Handle link events - those that have data-analytics
    elements = document.querySelectorAll("a[data-analytics]");
    registerAnalyticsEvents(elements, handleLinkEvent);

    // Handle button form events - those that have data-analytics
    elements = document.querySelectorAll("button[data-analytics]");
    registerAnalyticsEvents(elements, handleFormEvent);
  }

  ////////////////////////////////////

  function doi_in_tracking_snippet () {
    if ((typeof DOI !== 'undefined') && DOI &&
        validate_doi(DOI))
    {
      console.log("*****DOI IN TRACKING SNIPPET");
      console.log(DOI);
    }
    return ((typeof DOI !== 'undefined') && DOI) ? DOI : null;
  }

  function doi_in_schema_org_md() {
    var ret = "";
    var element, json, url, doi, identifiers;

    if ((element = document.querySelector('script[type="application/ld+json"]')) &&
        (json = JSON.parse(element.textContent)) &&
        (('@context' in json) && (json['@context'] == 'http://schema.org')))
    {
      if (('@id' in json) && (url = json['@id']) &&
          (doi = doi_from_url(url)))
      {
        ret = doi;
      } else if (('identifier' in json) && json.identifier) {
        identifiers = [];
        if (typeof json.identifier == 'string') {
          identifiers[0] = json.identifier;
        } else if (Array.isArray(json.identifier)) {
          identifiers = json.identifier;
        }
        identifiers.every(url => {
          if (url && (doi = doi_from_url(url))) {
            ret = doi;
            return false;
          } else {
            return true;
          }
        });
      }
    }

    if (ret) {
      console.log("*****DOI IN SCHEMA.ORG METADATA");
      console.log(ret);
    }
    return ret;
  }

  function doi_in_dublin_core_md() {
    var ret = "";
    var element, url, doi;

    if ((element = document.querySelector('meta[name="DC.Identifier"]')) &&
        (url = element.getAttribute('content')) &&
        (doi = doi_from_url(url)))
    {
      ret = doi;
      console.log("*****DOI IN DUBLIN CORE METADATA");
      console.log(ret);
    }
    return ret;
  }

  function doi_in_url() {
    var ret = "";
    var url, doi;

    if ((typeof TEST_URL !== 'undefined') && TEST_URL) {
      url = TEST_URL;
    } else {
      url = document.URL;
    }

    if (url && (doi = doi_from_doc_url(url)))
    {
      ret = doi;
      console.log("*****DOI IN URL");
      console.log(ret);
    }

    return ret;
  }

  //
  // Iterate Elements and add download event properties.
  //
  // @param {NodeList} Array of elements
  // @param {string} callback function name
  //
  function registerDownloadProperties(elements, doi) {
    var props = DOWNLOAD_PROPS;

    if (!elements) {
      return;
    }

    if (doi) {
      props.props.doi = doi;
    }

    // ultimately, we want to get and parse any properties that are already there.
    for (var i = 0; i < elements.length; i++) {
        elements[i].setAttribute('data-analytics', '"' + DOWNLOAD_EVENT + '", ' + JSON.stringify(props));
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  //  CUSTOM EVENT HANDLER CODE FROM PLAUSIBLE.IO FOR 'data-analytics' link and form events:
  //  https://plausible.io/docs/custom-event-goals
  //////////////////////////////////////////////////////////////////////////////////////////

  //
  // Iterate Elements and add event listener
  //
  // @param {NodeList} Array of elements
  // @param {string} callback function name
  //
  function registerAnalyticsEvents(elements, callback) {
      for (var i = 0; i < elements.length; i++) {
          elements[i].addEventListener('click', callback);
          elements[i].addEventListener('auxclick', callback);
      }
  }

  //
  // Handle Link Events with plausible
  // https://github.com/plausible/analytics/blob/e1bb4368460ebb3a0bb86151b143176797b686cc/tracker/src/plausible.js#L74
  //
  // @param {Event} click
  //
  function handleLinkEvent(event) {
      var link = event.target;
      var middle = event.type == "auxclick" && event.which == 2;
      var click = event.type == "click";
      while (link && (typeof link.tagName == 'undefined' || link.tagName.toLowerCase() != 'a' || !link.href)) {
          link = link.parentNode;
      }
      if (middle || click)
          registerEvent(link.getAttribute('data-analytics'));

      // Delay navigation so that Plausible is notified of the click
      if (!link.target) {
          if (!(event.ctrlKey || event.metaKey || event.shiftKey) && click) {
              setTimeout(function () {
                  location.href = link.href;
              }, 150);
              event.preventDefault();
          }
      }
  }

  //
  // Handle form button submit events with plausible
  //
  // @param {Event} click
  //
  function handleFormEvent(event) {
    event.preventDefault();

    registerEvent(event.target.getAttribute('data-analytics'));

    setTimeout(function () {
        event.target.form.submit();
    }, 150);
  }

  /**
  * Parse data and call plausible
  * Using data attribute in html eg. data-analytics='"Register", {"props":{"plan":"Starter"}}'
  *
  * @param {string} data - plausible event "Register", {"props":{"plan":"Starter"}}
  */
  function registerEvent(data) {
    // break into array
    if (!data) {
      return;
    }
    let attributes = data.split(/,(.+)/);

    // Parse it to object
    let events = [JSON.parse(attributes[0]), JSON.parse(attributes[1] || '{}')];

    plausible(...events);
  }

  ///////////////////////////////////////////////////////////////
  // Functions derived from:
  //   https://github.com/datacite/bolognese/blob/0f3b1d1f3830399a24e69d0f2262e7ff7c0190c9/lib/bolognese/doi_utils.rb
  //   https://github.com/datacite/pidcheck/blob/master/crawler/pidcheck/spiders/pid_spider.py
  ///////////////////////////////////////////////////////////////

  function doi_from_url(url) {
    var ret = "";
    var doi;

    if (url &&
        (doi = url.match(/^(?:(http|https):\/(\/)?(dx\.)?(doi.org|handle.stage.datacite.org|handle.test.datacite.org)\/)?(doi:)?(10\.\d{4,5}\/.+)$/)) &&
        (doi = doi[6]) &&
        (doi = decodeURIComponent(doi).toLowerCase()))
    {
      ret = doi
    }

    return ret;
  }

  function doi_from_doc_url(url) {
    var ret = "";
    var path, text, doi;

    if (url &&
      (url = new URL(url)) &&
      (path = url.pathname) &&
      (text = path.match(/\/doi:(.*)$/)) &&
      (text = text[1].replace(/\/$/, '')) &&
      (doi = decodeURIComponent(text)) &&
      (validate_doi(doi)))
    {
      ret = doi;
    }

    return ret;
  }

  function validate_doi(doi) {
    var ret = "";

    if (doi &&
      (doi = doi.match(/^(10\.\d{4,5}\/.+)$/)) &&
      (doi[1]))
    {
      ret = doi[1];
    }

    return ret;
  }
})
