# METIS: Migration Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md). This document is the authoritative reference for writing and registering database and import migrations in METIS.

## Overview

A mission component is a distinct part of a mission which is derived from a specific piece of data within a mission document. All mission components are interconnected within a mission. All other mission components can theoretically be reached from any given mission component via a chain of references.

When creating a new mission component type, it is essential to update the type maps within the shared, client, and server folders. These type maps are used to define which classes are used in the shared folder, the client folder, and the server folder.

**IMPORTANT** When editing a mission-component class in the **shared folder**. It is **CRUCIAL** to make sure references within the class to other mission components are derived from T. Using the base class as the type WILL BREAK THE SERVER AND CLIENT code. Instead, extract the appropriate class from `T` so that when `T` represents the server or client maps, the correct class will be typed on the server and client. For example, use `T['node']` instead of `MissionNode<T>` when referencing nodes in a base mission-component class.
