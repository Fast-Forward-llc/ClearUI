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
    public class BaseVueInputTagHelper : TagHelper
    {
        [HtmlAttributeName("asp-for")]
        public ModelExpression? AspFor { get; set; }

        [HtmlAttributeName("asp-for:value")]
        public ModelExpression? AspForValue { get; set; } = null;

        [HtmlAttributeName("asp-for:v-model")]
        public ModelExpression? AspForVModel { get; set; } = null;

        [HtmlAttributeName("asp-for:list-items")]
        public ModelExpression? AspForListItems { get; set; } = null;


        protected bool IsLazy;
        protected bool hasId;
        protected bool hasName;
        protected bool hasLabel;
        protected bool hasValue;
        protected bool hasVModel;
        protected bool hasRequired;
        protected bool hasReadonly;
        protected bool hasListItems;
        protected TagHelperAttribute? IdAttr;
        protected TagHelperAttribute? NameAttr;
        protected TagHelperAttribute? LabelAttr;
        protected TagHelperAttribute? ValueAttr;
        protected TagHelperAttribute? VModelAttr;
        protected TagHelperAttribute? RequiredAttr;
        protected TagHelperAttribute? ReadonlyAttr;
        protected string? SuppressModelPrefix;

        public override void Init(TagHelperContext context)
        {
            base.Init(context);
            if (context.Items.ContainsKey("SuppressAspModelPrefix"))
                SuppressModelPrefix = context.Items["SuppressAspModelPrefix"].ToString();
            IsLazy = context.AllAttributes.Any(x => (x.Name.StartsWith("v-model") || x.Name.StartsWith("asp-for")) &&(x.Name.EndsWith(".lazy") || x.Name.Contains(".lazy.")));
            IdAttr = context.AllAttributes.FirstOrDefault(x=>x.Name.ToLower()=="id"||x.Name.ToLower()==":id");
            hasId = IdAttr != null;
            hasName = context.AllAttributes.TryGetAttribute("name", out NameAttr) ? true :context.AllAttributes.TryGetAttribute(":name", out NameAttr);
            hasLabel = context.AllAttributes.TryGetAttribute("label", out LabelAttr) ? true :context.AllAttributes.TryGetAttribute(":label", out LabelAttr);
            hasValue = context.AllAttributes.TryGetAttribute("value", out ValueAttr) ? true :context.AllAttributes.TryGetAttribute(":value", out ValueAttr);
            hasVModel = context.AllAttributes.TryGetAttribute("v-model", out VModelAttr);
            hasRequired = context.AllAttributes.TryGetAttribute("required", out RequiredAttr);
            hasReadonly = context.AllAttributes.TryGetAttribute("readonly", out ReadonlyAttr);
            hasListItems = context.AllAttributes.TryGetAttribute(":list-items", out ReadonlyAttr);
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            base.Process(context, output);
            if (hasReadonly) //if plain html 'readonly' attribute is present, convert it to ':readonly="true"'
            {
                output.Attributes.Remove(ReadonlyAttr);
                output.Attributes.SetAttribute(":readonly", "true");
            }
            if (hasRequired) //if plain html 'required' attribute is present, convert it to ':required="true"'
            {
                output.Attributes.Remove(RequiredAttr);
                output.Attributes.SetAttribute(":required", "true");
            }
            //Set up v-model binding
            if (AspForVModel != null)
            {
                hasVModel = true;
                var vmodel = FormatModelName(AspForVModel.Name);
                if (IsLazy)
                    output.Attributes.SetAttribute("v-model.lazy", vmodel);
                else
                    output.Attributes.SetAttribute("v-model", vmodel);
            }

            //Set up value binding
            if (AspForValue != null)
            {
                hasValue = true;
                var value = FormatModelName(AspForValue.Name);
                output.Attributes.SetAttribute(":value", value);
            }

            //Set up list items binding
            if (AspForListItems != null)
            {
                hasListItems = true;
                var value = FormatModelName(AspForListItems.Name);
                output.Attributes.SetAttribute(":list-items", value);
            }
        }

        protected string FormatModelName(string name)
        {
            if (string.IsNullOrWhiteSpace(SuppressModelPrefix)) return name;
            if (name.StartsWith(SuppressModelPrefix + "."))
            {
                name = name.Substring(SuppressModelPrefix.Length + 1);
            }
            return name;
        }
    }
}
