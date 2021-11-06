---
title: "Intellij 平台插件开发 API"
date: 2021-11-06T19:47:35+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 相关资源

* [官方文档](https://plugins.jetbrains.com/docs/intellij/basics.html)
* [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples)
* [插件源码搜索浏览](https://plugins.jetbrains.com/intellij-platform-explorer)
* [本文 Demo 库](https://github.com/rectcircle/learn-intellij-platform-plugin)

## 相关术语

### FQN

Fully qualified name, 完全限定名称。在本文语境中，可能是

* 插件中各个贡献点（组件）的 ID
* 类的全名

## 本地化

TODO

## 状态持久化

> [官方文档](https://plugins.jetbrains.com/docs/intellij/persisting-state-of-components.html)

插件开发需要持久化一些状态到磁盘中，以做到重启后状态恢复（如保存设置项）。Intellij 平台提供了 `com.intellij.openapi.components.PersistentStateComponent` 接口， `com.intellij.openapi.components.State` 注解，以及 `com.intellij.openapi.components.Storage` 注解实现该能力。

### 实现 PersistentStateComponent

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/settings/AppSettingsState.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.PersistentStateComponent;
import com.intellij.openapi.components.State;
import com.intellij.openapi.components.Storage;
import com.intellij.util.xmlb.XmlSerializerUtil;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

@State(
        name = "org.intellij.sdk.settings.AppSettingsState", // 该状态存储的唯一标识符，最终会作为 xml 文件的 tags
        // reloadable = false, // default true，如果序列化的文件被外部程序更改了，是否重新加载窗口
        storages = @Storage("SdkSettingsPlugin.xml") // 存储文件名，Project 级别状态，且不需要存储到代码仓库，需使用 StoragePathMacros.WORKSPACE_FILE
)
public class AppSettingsState implements PersistentStateComponent<AppSettingsState> {

    public String userId = "John Q. Public";
    public boolean ideaStatus = false;

    public static AppSettingsState getInstance() {
        return ApplicationManager.getApplication().getService(AppSettingsState.class);
    }

    @Nullable
    @Override
    public AppSettingsState getState() {
        return this;
    }

    @Override
    public void loadState(@NotNull AppSettingsState state) {
        XmlSerializerUtil.copyBean(state, this);
    }

}
```

### PersistentStateComponent 生命周期

* `loadState`
    * 实例化该对象时，且对应位置存在序列化文件时，被调用。
    * 磁盘上文件被修改了，此时开发者需要自己来处理状态变更，如果不处理，可以通过 `reloadable = true` 通过重载来解决。
* `getState` 当用户在设置弹窗点击保存、关闭 IDE、IDE 停用时，被调用。调用是会比较是否和默认值一致，如果一致，则磁盘中不会有文件。否则将写入磁盘中。

### 在 plugin.xml 中注册

应用级别状态（所有窗口共享该状态）

```xml
    <extensions defaultExtensionNs="com.intellij">
        <applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
    </extensions>
```

项目级别状态（每个窗口一个）

```xml
    <extensions defaultExtensionNs="com.intellij">
        <projectService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
    </extensions>
```

### 存储位置

* Application 级别状态，存储在 `~/Library/ApplicationSupport/JetBrains/IntelliJIdea2021.2/options` 路径下
* Project 级别状态，存储在 `~/.idea` 下
    * 如果使用 `StoragePathMacros.WORKSPACE_FILE` 常量。则存储在
        * `path/to/project/project.iws` - for file-based projects
        * `path/to/project/.idea/workspace.xml` - for directory-based ones
    * `StoragePathMacros.WORKSPACE_FILE` 是有特殊的含义，表示该状态，不会同步到代码仓库中，是该用户特化的配置而不是团队共享的，参见 [.idea gitignore 说明](https://intellij-support.jetbrains.com/hc/en-us/articles/206544839-How-to-manage-projects-under-Version-Control-Systems)
    * `StoragePathMacros.WORKSPACE_FILE` 只能在 项目级别使用，如果在 Application 级别使用，将报错

序列化后的一个例子如下：

```xml
<application>
  <component name="org.intellij.sdk.settings.AppSettingsState">
    <option name="ideaStatus" value="true" />
  </component>
</application>
```

### 场景：实现一个通用动态状态存储工具

可以看出，Intellij 插件的状态存储是静态的，需要和类绑定。使用起来有些不方便。因此，想基于该 API，实现动态的状态存储 API。API 设计如下：

```java
enum StatueLevel {
    Global,
    Workspace,
}

interface DynamicState {
    String get(String key, StatueLevel level);
    void update(String key, String value, StatueLevel level);
}
```

实现思路：

* 创建一个类 DynamicStateImpl 实现，PersistentStateComponent，只有一个字段 `Value`， 为序列化后的 JSON。
* 创建两个类继承 GlobalDynamicState、 WorkspaceGlobalDynamicState 继承 `DynamicStateImpl`
    * GlobalDynamicState 添加 `@State` 注解，存储在 `global.xml`
    * WorkspaceGlobalDynamicState 添加 `@State` 注解，存储在 `StoragePathMacros.WORKSPACE_FILE`
* 创建类 DynamicStateService 依赖注入 GlobalDynamicState、 WorkspaceGlobalDynamicState，并实现 DynamicState 接口
* GlobalDynamicState、 WorkspaceGlobalDynamicState、 DynamicStateService 分别注册为 applicationService、projectService、projectService

## 配置项

> [官方文档](https://plugins.jetbrains.com/docs/intellij/settings-tutorial.html) | [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples/tree/main/settings)

配置项在 Intellij 是以 UI 窗口的方式来配置的，因此需要定一个 Swing 组件，存储则使用上文提到的[状态持久化](#状态持久化)。再加上配置项入口类。这就是一个典型的 MVC 模型。

* Model - 状态持久化
* Controller - plugin.xml 配置的入口类
* View - Swing 组件

本例中将创建一个全局配置。

### 入口类 `AppSettingsConfigurable`

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/settings/AppSettingsConfigurable.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;


import com.intellij.openapi.options.Configurable;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;

/**
 * Controller，应用级别配置的实现，必须提供无参数构造函数。
 */
public class AppSettingsConfigurable implements Configurable {
    // 有一些标记接口，如 Configurable.NoScroll、Configurable.NoMargin，用来配置窗口的滚动和边框

    private AppSettingsComponent mySettingsComponent;

    @Nls(capitalization = Nls.Capitalization.Title)
    @Override
    public String getDisplayName() {
        return "SDK: Application Settings Example";
    }

    @Override
    public JComponent getPreferredFocusedComponent() {
        return mySettingsComponent.getPreferredFocusedComponent();
    }

    // 创建一个 Swing 组件，打开设置该设置窗口，该函数会被调用
    @Nullable
    @Override
    public JComponent createComponent() {
        mySettingsComponent = new AppSettingsComponent();
        return mySettingsComponent.getPanel();
    }

    // 用于判断是否 enable apply 按钮
    @Override
    public boolean isModified() {
        AppSettingsState settings = AppSettingsState.getInstance();
        boolean modified = !mySettingsComponent.getUserNameText().equals(settings.userId);
        modified |= mySettingsComponent.getIdeaUserStatus() != settings.ideaStatus;
        return modified;
    }

    // 点击 apply 触发
    @Override
    public void apply() {
        AppSettingsState settings = AppSettingsState.getInstance();
        settings.userId = mySettingsComponent.getUserNameText();
        settings.ideaStatus = mySettingsComponent.getIdeaUserStatus();
    }

    // 在 Configurable.createComponent 后立即被调用，在此处初始化 UI 值
    @Override
    public void reset() {
        AppSettingsState settings = AppSettingsState.getInstance();
        mySettingsComponent.setUserNameText(settings.userId);
        mySettingsComponent.setIdeaUserStatus(settings.ideaStatus);
    }

    // 用户点击 UI 上的确认或者取消，窗口销毁后会调用该函数
    @Override
    public void disposeUIResources() {
        mySettingsComponent = null;
    }
}
```

### 在 plugin.xml 注册入口类

`src/main/resources/META-INF/plugin.xml`

分为两种配置级别，application 级别 和 project 级别。

```xml
        <!-- 属性 applicationConfigurable 和 projectConfigurable 贡献点
            parentId - 定义当前设置项在设置窗口中的位置，可选值为 https://plugins.jetbrains.com/docs/intellij/settings-guide.html#values-for-parent-id-attribute
            Id - 唯一 ID，建议和类名一致
            instance - Configurable 实现类的全名，和 provider 二选一
            provider - ConfigurableProvider 实现类的全名，和 instance 二选一
            nonDefaultProject - projectConfigurable 专属属性，是否允许用户配置默认配置 true - 该配置默认值写死的， false - 该配置默认值用户可以配置
                nonDefaultProject = false 场景例子：编辑器字体，用户可以改变默认的字体，也可以专门为这个项目设置特定的配置
            displayName - 展示名，不需要本地化场景
            key 和 bundle - 需要本地化场景
            groupWeight - 排序顺序，默认为 0 （权重最低）
            dynamic - 设置项内容是否是动态的计算的，默认 false
            childrenEPName - 如果配置项有多页，可以通过该字段组成树形结构？？
        -->
        <!-- 应用级别配置贡献点 -->
        <!-- https://plugins.jetbrains.com/docs/intellij/settings-guide.html#settings-declaration-attributes -->
        <applicationConfigurable parentId="tools"
                                 instance="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsConfigurable"
                                 id="org.intellij.sdk.settings.AppSettingsConfigurable"
                                 displayName="SDK: Application Settings Example"/>
<!--        <projectConfigurable parentId="tools" instance="org.company.ProjectSettingsConfigurable"-->
<!--                             id="org.company.ProjectSettingsConfigurable" displayName="My Project Settings"-->
<!--                             nonDefaultProject="true"/>-->
```

### 状态持久化实现

参见上文[状态持久化](#状态持久化)，注意需注册到 plugin.xml

`src/main/resources/META-INF/plugin.xml`

```xml
        <applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
```

### 配置 UI `AppSettingsComponent`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;

import com.intellij.ui.components.JBCheckBox;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBTextField;
import com.intellij.util.ui.FormBuilder;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

/**
 * 封装 Swing 组件
 */
public class AppSettingsComponent {

    private final JPanel myMainPanel;
    private final JBTextField myUserNameText = new JBTextField();
    private final JBCheckBox myIdeaUserStatus = new JBCheckBox("Do you use IntelliJ IDEA? ");

    public AppSettingsComponent() {
        myMainPanel = FormBuilder.createFormBuilder()
                .addLabeledComponent(new JBLabel("Enter user name: "), myUserNameText, 1, false)
                .addComponent(myIdeaUserStatus, 1)
                .addComponentFillVertically(new JPanel(), 0)
                .getPanel();
    }

    public JPanel getPanel() {
        return myMainPanel;
    }

    public JComponent getPreferredFocusedComponent() {
        return myUserNameText;
    }

    @NotNull
    public String getUserNameText() {
        return myUserNameText.getText();
    }

    public void setUserNameText(@NotNull String newText) {
        myUserNameText.setText(newText);
    }

    public boolean getIdeaUserStatus() {
        return myIdeaUserStatus.isSelected();
    }

    public void setIdeaUserStatus(boolean newStatus) {
        myIdeaUserStatus.setSelected(newStatus);
    }

}
```

## 调试

TODO
