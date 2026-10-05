// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System;

namespace ClearUITagHelpers
{
    [HtmlTargetElement("cui-http-request", TagStructure = TagStructure.NormalOrSelfClosing)]
    [HtmlTargetElement("cui-http-request", Attributes = "asp-action")]
    [HtmlTargetElement("cui-http-request", Attributes = "asp-controller")]
    public class HttpRequestTagHelper : TagHelper
    {
        private readonly IUrlHelperFactory _urlHelperFactory;

        public HttpRequestTagHelper(IUrlHelperFactory urlHelperFactory)
        {
            _urlHelperFactory = urlHelperFactory;
        }

        [ViewContext]
        [HtmlAttributeNotBound]
        public ViewContext? ViewContext { get; set; }

        [HtmlAttributeName("asp-controller")]
        public string? Controller { get; set; }

        [HtmlAttributeName("asp-action")]
        public string? Action { get; set; }

        [HtmlAttributeName("asp-route-id")]
        public string? RouteId { get; set; }  // Optional route parameter

        [HtmlAttributeName("url")]
        public string? Url { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            if (string.IsNullOrWhiteSpace(Url))
            {
                var urlHelper = _urlHelperFactory.GetUrlHelper(ViewContext);

                var routeValues = new { id = RouteId };

                Url = urlHelper.Action(Action, Controller, RouteId != null ? routeValues : null);
            }
            output.Attributes.SetAttribute("url", Url);
        }
    }

}
