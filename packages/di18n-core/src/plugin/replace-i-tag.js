let tag = {
  'Switch': 'i-switch',
  'Circle': 'i-circle',
};

let prefixTag = {
  'i-affix': 'Affix',
  'i-alert': 'Alert',
  'i-anchor-link': 'AnchorLink',
  'i-anchor': 'Anchor',
  'i-auto-complete': 'AutoComplete',
  'i-avatar': 'Avatar',
  'i-back-top': 'BackTop',
  'i-badge': 'Badge',
  'i-breadcrumb-item': 'BreadcrumbItem',
  'i-breadcrumb': 'Breadcrumb',
  'i-button-group': 'ButtonGroup',
  'i-button': 'Button',
  'i-card': 'Card',
  'i-carousel-item': 'CarouselItem',
  'i-carousel': 'Carousel',
  'i-cascader': 'Cascader',
  'i-cell-group': 'CellGroup',
  'i-cell': 'Cell',
  'i-checkbox-group': 'CheckboxGroup',
  'i-checkbox': 'Checkbox',
  'i-col': 'Col',
  'i-collapse': 'Collapse',
  'i-color-picker': 'ColorPicker',
  'i-content': 'Content',
  'i-date-picker': 'DatePicker',
  'i-divider': 'Divider',
  'i-drawer': 'Drawer',
  'i-dropdown-item': 'DropdownItem',
  'i-dropdown-menu': 'DropdownMenu',
  'i-dropdown': 'Dropdown',
  'i-footer': 'Footer',
  'i-form-item': 'FormItem',
  'i-form': 'Form',
  'i-header': 'Header',
  'i-icon': 'Icon',
  'i-input-number': 'InputNumber',
  'i-input': 'Input',
  'i-layout': 'Layout',
  'i-menu': 'Menu',
  'i-menu-group': 'MenuGroup',
  'i-menu-item': 'MenuItem',
  'i-sider': 'Sider',
  'i-submenu': 'Submenu',
  'i-modal': 'Modal',
  'i-option-group': 'OptionGroup',
  'i-option': 'Option',
  'i-page': 'Page',
  'i-panel': 'Panel',
  'i-poptip': 'Poptip',
  'i-progress': 'Progress',
  'i-radio-group': 'RadioGroup',
  'i-radio': 'Radio',
  'i-rate': 'Rate',
  'i-row': 'Row',
  'i-scroll': 'Scroll',
  'i-select': 'Select',
  'i-slider': 'Slider',
  'i-spin': 'Spin',
  'i-split': 'Split',
  'i-step': 'Step',
  'i-steps': 'Steps',
  'i-table': 'Table',
  'i-tabs': 'Tabs',
  'i-tab-pane': 'TabPane',
  'i-tag': 'Tag',
  'i-timeline-item': 'TimelineItem',
  'i-timeline': 'Timeline',
  'i-time-picker': 'TimePicker',
  'i-time': 'Time',
  'i-tooltip': 'Tooltip',
  'i-transfer': 'Transfer',
  'i-tree': 'Tree',
  'i-upload': 'Upload',
};

function replaceTag1(source, tagMap) {
  Object.keys(tagMap).forEach(i => {
    source = source.replace(new RegExp(`<${tagMap[i]}(?!-)`, 'g'), `<${i}`)
      .replace(new RegExp(`</${tagMap[i]}>`, 'g'), `</${i}>`);
  });
  return source;
}

function replaceTag2(source, tagMap) {
  Object.keys(tagMap).forEach(i => {
    source = source.replace(new RegExp(`<${i}(?!-)`, 'g'), `<${tagMap[i]}`)
      .replace(new RegExp(`</${i}>`, 'g'), `</${tagMap[i]}>`);
  });
  return source;
}

module.exports = {
  replaceTemplateTag1(tpl) {
    tpl = replaceTag1(tpl, tag);
    tpl = replaceTag1(tpl, prefixTag);
    return tpl;
  },

  replaceTemplateTag2(tpl) {
    tpl = replaceTag2(tpl, tag);
    tpl = replaceTag2(tpl, prefixTag);
    return tpl;
  },
};
