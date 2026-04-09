import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { treeRoutes } from "../modules/Tree/tree.route";
import { memberRoutes } from "../modules/Member/member.route";
import { requestRoutes } from "../modules/Request/request.route";
import { superAdminRoutes } from "../modules/SuperAdmin/superadmin.route";
import { announcementRoutes } from "../modules/Announcement/announcement.route";
import { bannerRoutes } from "../modules/Banner/banner.route";
import { pollRoutes } from "../modules/Poll/poll.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/tree",
    route: treeRoutes,
  },
  {
    path: "/member",
    route: memberRoutes,
  },
  {
    path: "/request",
    route: requestRoutes,
  },
  {
    path: "/super-admin",
    route: superAdminRoutes,
  },
  {
    path: "/announcement",
    route: announcementRoutes,
  },
  {
    path: "/banner",
    route: bannerRoutes,
  },
  {
    path: "/poll",
    route: pollRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

export default router;
