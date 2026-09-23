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
    [HtmlTargetElement("cui-grid", TagStructure = TagStructure.NormalOrSelfClosing)]
    public class GridTagHelper : BaseVueInputTagHelper
    {

        [HtmlAttributeName("asp-for:grid-items")]
        public ModelExpression? AspForGridItems { get; set; }
        [HtmlAttributeName("asp-for:caption")]
        public ModelExpression? AspForCaption { get; set; }
        [HtmlAttributeName("asp-for:column-config")]
        public ModelExpression? AspForColumnConfig { get; set; }

        protected bool hasGridItems;
        protected bool hasCaption;
        protected bool hasColumnConfig;

        public override void Init(TagHelperContext context)
        {
            base.Init(context);
            hasCaption = context.AllAttributes.TryGetAttribute("caption", out _ ) ? true : context.AllAttributes.TryGetAttribute(":caption", out _);
            hasGridItems = context.AllAttributes.TryGetAttribute(":grid-items", out _);
            hasColumnConfig = context.AllAttributes.TryGetAttribute(":column-config", out _);
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            base.Process(context, output);

            //Set up grid items binding
            if (AspForGridItems != null)
            {
                hasGridItems = true;
                var value = FormatModelName(AspForGridItems.Name);
                output.Attributes.SetAttribute(":grid-items", value);
            }

            // Set up caption binding
            if (AspForCaption != null)
            {
                hasCaption = true;
                var value = FormatModelName(AspForCaption.Name);
                output.Attributes.SetAttribute(":caption", value);
            }

            // Set up column config binding
            if (AspForColumnConfig != null)
            {
                hasColumnConfig = true;
                var value = FormatModelName(AspForColumnConfig.Name);
                output.Attributes.SetAttribute(":column-config", value);
            }
        }
    }
}
