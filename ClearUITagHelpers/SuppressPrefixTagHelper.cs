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
    [HtmlTargetElement("*", Attributes ="suppress-asp-model-prefix")]
    public class SuppressPrefixTagHelper : TagHelper
    {
        [ViewContext]
        [HtmlAttributeNotBound]
        public ViewContext? ViewContext { get; set; }

        [HtmlAttributeName("suppress-asp-model-prefix")]
        public ModelExpression? SuppressModelPrefix { get; set; }

        

        public override void Init(TagHelperContext context)
        {
            base.Init(context);
            if (SuppressModelPrefix?.Name != null)
                context.Items.Add("SuppressAspModelPrefix", SuppressModelPrefix.Name);
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            base.Process(context, output);
            
        }
    }
}
