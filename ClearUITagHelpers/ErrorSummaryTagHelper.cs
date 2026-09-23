// Copyright (c) Fast Forward, LLC. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClearUITagHelpers
{
    [HtmlTargetElement("cui-error-summary", TagStructure = TagStructure.NormalOrSelfClosing)]
    public class ErrorSummaryTagHelper : BaseVueInputTagHelper
    {
        protected bool hasErrors;
        protected bool hasHeading;

        public override void Init(TagHelperContext context)
        {
            base.Init(context);
            hasErrors = context.AllAttributes.TryGetAttribute(":errors", out _ );
            hasHeading = context.AllAttributes.TryGetAttribute("heading", out _ ) ? true : context.AllAttributes.TryGetAttribute(":heading", out _);
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            base.Process(context, output);

            //Set up grid items binding
            if (AspFor != null)
            {
                //Set up errors attribute
                if (!hasErrors)
                {
                    output.Attributes.SetAttribute(":errors", FormatModelName(AspFor.Name));
                }
                //Set up heading attribute
                if (!hasHeading)
                {
                    output.Attributes.SetAttribute("heading", FormatModelName(AspFor.Metadata.DisplayName ?? AspFor.Name));
                }
            }
        }
    }
}
